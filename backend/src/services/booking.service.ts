import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { sendTicketEmail } from './email.service.js';
import { broadcastSeatUpdate } from '../socket.js';
import { WaitlistService } from './waitlist.service.js';

export class BookingService {
  /**
   * Complete checkout and confirm booking for held seats
   */
  static async checkout(showId: string, showSeatIds: string[], userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { event: true, venue: true },
    });
    if (!show) throw { statusCode: 404, message: 'Show not found' };

    const now = new Date();

    // Perform atomic checkout inside transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Validate all seats are held by this user and not expired
      const heldSeats = await tx.showSeat.findMany({
        where: {
          id: { in: showSeatIds },
          showId,
          heldByUserId: userId,
          status: { in: ['HELD', 'OFFERED'] },
          holdExpiresAt: { gt: now },
        },
        include: { seat: true },
      });

      if (heldSeats.length !== showSeatIds.length) {
        throw {
          statusCode: 400,
          message: 'Seat hold expired or invalid. Please select seats again.',
        };
      }

      const totalPrice = heldSeats.reduce((sum, seat) => sum + seat.price, 0);
      const bookingRef = `TKT-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Create Booking record
      const createdBooking = await tx.booking.create({
        data: {
          bookingRef,
          userId,
          showId,
          totalPrice,
          status: 'CONFIRMED',
          items: {
            create: heldSeats.map((hs) => ({
              showSeatId: hs.id,
              seatPrice: hs.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              showSeat: { include: { seat: true } },
            },
          },
        },
      });

      // Update seat statuses to BOOKED
      await tx.showSeat.updateMany({
        where: { id: { in: showSeatIds } },
        data: {
          status: 'BOOKED',
          heldByUserId: null,
          holdExpiresAt: null,
        },
      });

      return createdBooking;
    });

    // Broadcast Socket.IO update for booked seats
    broadcastSeatUpdate(showId, {
      seatIds: showSeatIds,
      status: 'BOOKED',
      heldByUserId: null,
      holdExpiresAt: null,
    });

    // Send Ticket Email asynchronously with embedded QR Code
    const seatNumbers = booking.items.map((i) => i.showSeat.seat.seatNumber);
    sendTicketEmail({
      toEmail: user.email,
      userName: user.name,
      bookingRef: booking.bookingRef,
      eventTitle: show.event.title,
      venueName: show.venue.name,
      venueAddress: show.venue.address,
      startTime: show.startTime,
      seatNumbers,
      totalPrice: booking.totalPrice,
    }).catch((err) => console.error('Failed to send email:', err));

    return {
      message: 'Booking confirmed successfully!',
      booking: {
        id: booking.id,
        bookingRef: booking.bookingRef,
        totalPrice: booking.totalPrice,
        status: booking.status,
        event: show.event,
        venue: show.venue,
        startTime: show.startTime,
        seats: seatNumbers,
        createdAt: booking.createdAt,
      },
    };
  }

  /**
   * Cancel a confirmed booking and trigger automated waitlist reallocation
   */
  static async cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        show: { include: { event: true } },
        items: {
          include: {
            showSeat: { include: { seat: true } },
          },
        },
      },
    });

    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.userId !== userId && booking.user.role !== 'ADMIN') {
      throw { statusCode: 403, message: 'Not authorized to cancel this booking' };
    }
    if (booking.status === 'CANCELLED') {
      throw { statusCode: 400, message: 'Booking is already cancelled' };
    }

    // Cancel booking and mark seats available
    const showSeatIds = booking.items.map((i) => i.showSeatId);

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      }),
      prisma.showSeat.updateMany({
        where: { id: { in: showSeatIds } },
        data: {
          status: 'AVAILABLE',
          heldByUserId: null,
          holdExpiresAt: null,
        },
      }),
    ]);

    // Broadcast seat status update
    broadcastSeatUpdate(booking.showId, {
      seatIds: showSeatIds,
      status: 'AVAILABLE',
      heldByUserId: null,
      holdExpiresAt: null,
    });

    // 🚀 TRIGGER AUTOMATED WAITLIST REALLOCATION FOR CANCELLED SEATS
    for (const item of booking.items) {
      const seat = item.showSeat;
      WaitlistService.processWaitlistForSeat(booking.showId, seat.seat.category, seat.id)
        .catch((err) => console.error('Waitlist reallocation error:', err));
    }

    return { message: 'Booking cancelled successfully. Seats returned to pool or offered to waitlist.' };
  }

  /**
   * Get customer booking history
   */
  static async getUserBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            event: true,
            venue: true,
          },
        },
        items: {
          include: {
            showSeat: { include: { seat: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      totalPrice: b.totalPrice,
      status: b.status,
      eventTitle: b.show.event.title,
      eventPoster: b.show.event.posterUrl,
      venueName: b.show.venue.name,
      startTime: b.show.startTime,
      seats: b.items.map((i) => ({
        id: i.showSeat.id,
        seatNumber: i.showSeat.seat.seatNumber,
        category: i.showSeat.seat.category,
        price: i.seatPrice,
      })),
      createdAt: b.createdAt,
    }));
  }
}
