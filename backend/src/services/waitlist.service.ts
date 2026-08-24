import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { sendWaitlistOfferEmail } from './email.service.js';
import { broadcastSeatUpdate } from '../socket.js';

export class WaitlistService {
  /**
   * Customer joins waitlist for a specific category of a show
   */
  static async joinWaitlist(showId: string, category: string, userId: string) {
    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) throw { statusCode: 404, message: 'Show not found' };

    const formattedCategory = category.toUpperCase();

    // Check if user is already waiting in this category
    const existing = await prisma.waitlist.findFirst({
      where: {
        showId,
        userId,
        category: formattedCategory,
        status: 'WAITING',
      },
    });

    if (existing) {
      throw { statusCode: 400, message: 'You are already on the waitlist for this category' };
    }

    const waitlistEntry = await prisma.waitlist.create({
      data: {
        showId,
        userId,
        category: formattedCategory,
        status: 'WAITING',
      },
      include: {
        show: { include: { event: true } },
        user: true,
      },
    });

    // Calculate queue position
    const queuePosition = await prisma.waitlist.count({
      where: {
        showId,
        category: formattedCategory,
        status: 'WAITING',
        createdAt: { lte: waitlistEntry.createdAt },
      },
    });

    return {
      message: 'Successfully joined waitlist',
      waitlistId: waitlistEntry.id,
      category: formattedCategory,
      queuePosition,
    };
  }

  /**
   * Process waitlist when a seat opens up (via cancellation or expired hold)
   */
  static async processWaitlistForSeat(showId: string, category: string, seatId: string) {
    const now = new Date();

    // Find the next waiting customer (FIFO order by createdAt)
    const nextCandidate = await prisma.waitlist.findFirst({
      where: {
        showId,
        category,
        status: 'WAITING',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        show: { include: { event: true } },
      },
    });

    if (!nextCandidate) {
      // No waitlist candidates. Ensure seat is AVAILABLE
      await prisma.showSeat.update({
        where: { id: seatId },
        data: {
          status: 'AVAILABLE',
          heldByUserId: null,
          holdExpiresAt: null,
        },
      });

      broadcastSeatUpdate(showId, {
        seatIds: [seatId],
        status: 'AVAILABLE',
        heldByUserId: null,
        holdExpiresAt: null,
      });
      return false;
    }

    const offerTtlMs = env.OFFER_TTL_SECONDS * 1000;
    const offerExpiresAt = new Date(now.getTime() + offerTtlMs);
    const offerToken = uuidv4();

    // Atomically offer seat to next candidate
    await prisma.$transaction([
      prisma.showSeat.update({
        where: { id: seatId },
        data: {
          status: 'OFFERED',
          heldByUserId: nextCandidate.userId,
          holdExpiresAt: offerExpiresAt,
        },
      }),
      prisma.waitlist.update({
        where: { id: nextCandidate.id },
        data: {
          status: 'OFFERED',
          offeredSeatId: seatId,
          offerExpiresAt,
          offerToken,
        },
      }),
    ]);

    const showSeat = await prisma.showSeat.findUnique({
      where: { id: seatId },
      include: { seat: true },
    });

    const seatNumber = showSeat ? showSeat.seat.seatNumber : 'N/A';
    const claimUrl = `${env.FRONTEND_URL}/claim-offer/${offerToken}`;

    // Broadcast seat update
    broadcastSeatUpdate(showId, {
      seatIds: [seatId],
      status: 'OFFERED',
      heldByUserId: nextCandidate.userId,
      holdExpiresAt: offerExpiresAt.toISOString(),
    });

    // Send email notification with claim offer link
    sendWaitlistOfferEmail({
      toEmail: nextCandidate.user.email,
      userName: nextCandidate.user.name,
      eventTitle: nextCandidate.show.event.title,
      category,
      seatNumber,
      claimUrl,
      offerExpiresAt,
    }).catch((err) => console.error('Failed to send waitlist offer email:', err));

    console.log(`✨ Offered seat ${seatNumber} to waitlisted user ${nextCandidate.user.email} (Expires: ${offerExpiresAt.toISOString()})`);
    return true;
  }

  /**
   * Get offer details by offerToken (for frontend claim page)
   */
  static async getOfferByToken(offerToken: string) {
    const waitlist = await prisma.waitlist.findUnique({
      where: { offerToken },
      include: {
        show: { include: { event: true, venue: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!waitlist) throw { statusCode: 404, message: 'Invalid or expired offer token' };

    const now = new Date();
    if (waitlist.status !== 'OFFERED' || (waitlist.offerExpiresAt && waitlist.offerExpiresAt <= now)) {
      throw { statusCode: 410, message: 'This seat offer has expired or already been processed' };
    }

    const showSeat = await prisma.showSeat.findUnique({
      where: { id: waitlist.offeredSeatId || '' },
      include: { seat: true },
    });

    if (!showSeat) throw { statusCode: 404, message: 'Offered seat no longer exists' };

    return {
      offerToken: waitlist.offerToken,
      status: waitlist.status,
      offerExpiresAt: waitlist.offerExpiresAt,
      eventTitle: waitlist.show.event.title,
      eventPoster: waitlist.show.event.posterUrl,
      venueName: waitlist.show.venue.name,
      startTime: waitlist.show.startTime,
      showId: waitlist.showId,
      showSeatId: showSeat.id,
      seatNumber: showSeat.seat.seatNumber,
      category: showSeat.seat.category,
      price: showSeat.price,
      user: waitlist.user,
    };
  }

  /**
   * Claim waitlist offer and convert to active seat hold for checkout
   */
  static async claimWaitlistOffer(offerToken: string, userId: string) {
    const offer = await this.getOfferByToken(offerToken);
    if (offer.user.id !== userId) {
      throw { statusCode: 403, message: 'This seat offer belongs to another user account' };
    }

    const now = new Date();
    const holdTtlMs = env.HOLD_TTL_SECONDS * 1000;
    const holdExpiresAt = new Date(now.getTime() + holdTtlMs);

    // Convert seat status from OFFERED to HELD and fulfill waitlist
    await prisma.$transaction([
      prisma.showSeat.update({
        where: { id: offer.showSeatId },
        data: {
          status: 'HELD',
          heldByUserId: userId,
          holdExpiresAt,
        },
      }),
      prisma.waitlist.update({
        where: { offerToken },
        data: {
          status: 'FULFILLED',
        },
      }),
    ]);

    broadcastSeatUpdate(offer.showId, {
      seatIds: [offer.showSeatId],
      status: 'HELD',
      heldByUserId: userId,
      holdExpiresAt: holdExpiresAt.toISOString(),
    });

    return {
      message: 'Offer claimed successfully! Seat is now held for checkout.',
      showId: offer.showId,
      showSeatId: offer.showSeatId,
      seatNumber: offer.seatNumber,
      expiresAt: holdExpiresAt.toISOString(),
    };
  }

  /**
   * Expire stale waitlist offers and re-offer to next candidate in queue
   */
  static async expireWaitlistOffers() {
    const now = new Date();

    const expiredOffers = await prisma.waitlist.findMany({
      where: {
        status: 'OFFERED',
        offerExpiresAt: { lte: now },
      },
    });

    for (const offer of expiredOffers) {
      console.log(`⏰ Waitlist offer ${offer.id} expired. Cascading seat offer...`);

      await prisma.waitlist.update({
        where: { id: offer.id },
        data: { status: 'EXPIRED' },
      });

      if (offer.offeredSeatId) {
        await this.processWaitlistForSeat(offer.showId, offer.category, offer.offeredSeatId);
      }
    }
  }

  /**
   * Get user's waitlist entries
   */
  static async getUserWaitlists(userId: string) {
    const waitlists = await prisma.waitlist.findMany({
      where: { userId },
      include: {
        show: { include: { event: true, venue: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return waitlists.map((w) => ({
      id: w.id,
      eventTitle: w.show.event.title,
      eventPoster: w.show.event.posterUrl,
      venueName: w.show.venue.name,
      startTime: w.show.startTime,
      category: w.category,
      status: w.status,
      offerToken: w.offerToken,
      offerExpiresAt: w.offerExpiresAt,
      createdAt: w.createdAt,
    }));
  }
}
