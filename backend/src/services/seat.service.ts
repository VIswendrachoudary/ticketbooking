import { prisma } from '../db/prisma.js';
import { acquireLock, releaseLock } from '../db/redis.js';
import { env } from '../config/env.js';
import { broadcastSeatUpdate } from '../socket.js';

export class SeatService {
  /**
   * Get seat map for a show with real-time status & TTL expiration handling
   */
  static async getShowSeatMap(showId: string, currentUserId?: string) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        event: true,
        venue: true,
        showSeats: {
          include: { seat: true },
          orderBy: [
            { seat: { rowLabel: 'asc' } },
            { seat: { colNumber: 'asc' } },
          ],
        },
      },
    });

    if (!show) throw { statusCode: 404, message: 'Show not found' };

    const now = new Date();

    // Map seats & sanitize expired holds dynamically
    const sanitizedSeats = show.showSeats.map((ss) => {
      let status = ss.status;
      let heldByUserId = ss.heldByUserId;
      let holdExpiresAt = ss.holdExpiresAt;

      // Auto-expire hold if expired in DB view
      if (
        (status === 'HELD' || status === 'OFFERED') &&
        holdExpiresAt &&
        holdExpiresAt <= now
      ) {
        status = 'AVAILABLE';
        heldByUserId = null;
        holdExpiresAt = null;
      }

      const isMyHold = currentUserId ? heldByUserId === currentUserId : false;

      return {
        id: ss.id,
        seatId: ss.seatId,
        seatNumber: ss.seat.seatNumber,
        rowLabel: ss.seat.rowLabel,
        colNumber: ss.seat.colNumber,
        category: ss.seat.category,
        price: ss.price,
        status,
        heldByUserId,
        holdExpiresAt: holdExpiresAt ? holdExpiresAt.toISOString() : null,
        isMyHold,
      };
    });

    // Category availability counts
    const categoryStats: Record<string, { total: number; available: number; price: number }> = {};
    sanitizedSeats.forEach((seat) => {
      if (!categoryStats[seat.category]) {
        categoryStats[seat.category] = { total: 0, available: 0, price: seat.price };
      }
      categoryStats[seat.category].total += 1;
      if (seat.status === 'AVAILABLE') {
        categoryStats[seat.category].available += 1;
      }
    });

    return {
      showId: show.id,
      event: show.event,
      venue: show.venue,
      startTime: show.startTime,
      endTime: show.endTime,
      seats: sanitizedSeats,
      categoryStats,
    };
  }

  /**
   * Hold seats atomically with TTL concurrency protection
   */
  static async holdSeats(showId: string, showSeatIds: string[], userId: string) {
    if (!showSeatIds || showSeatIds.length === 0) {
      throw { statusCode: 400, message: 'No seats specified to hold' };
    }

    const lockKey = `show:${showId}:hold`;
    const lockAcquired = await acquireLock(lockKey, 3000);
    if (!lockAcquired) {
      throw { statusCode: 409, message: 'High concurrency demand. Please retry seat selection.' };
    }

    try {
      const now = new Date();
      const ttlMs = env.HOLD_TTL_SECONDS * 1000;
      const expiresAt = new Date(now.getTime() + ttlMs);

      // Perform atomic database verification & update in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Fetch target showSeats
        const seats = await tx.showSeat.findMany({
          where: {
            id: { in: showSeatIds },
            showId,
          },
          include: { seat: true },
        });

        if (seats.length !== showSeatIds.length) {
          throw { statusCode: 404, message: 'One or more requested seats do not exist for this show' };
        }

        // Check availability
        for (const seat of seats) {
          if (seat.status === 'BOOKED') {
            throw {
              statusCode: 409,
              message: `Seat ${seat.seat.seatNumber} is already booked`,
            };
          }
          if (
            (seat.status === 'HELD' || seat.status === 'OFFERED') &&
            seat.heldByUserId !== userId &&
            seat.holdExpiresAt &&
            seat.holdExpiresAt > now
          ) {
            throw {
              statusCode: 409,
              message: `Seat ${seat.seat.seatNumber} is currently held by another customer`,
            };
          }
        }

        // Execute atomic update
        const updated = await tx.showSeat.updateMany({
          where: {
            id: { in: showSeatIds },
            showId,
            OR: [
              { status: 'AVAILABLE' },
              { heldByUserId: userId },
              { holdExpiresAt: { lte: now } },
            ],
          },
          data: {
            status: 'HELD',
            heldByUserId: userId,
            holdExpiresAt: expiresAt,
            version: { increment: 1 },
          },
        });

        if (updated.count !== showSeatIds.length) {
          throw {
            statusCode: 409,
            message: 'Conflict: One or more selected seats were taken by another user simultaneously',
          };
        }

        return tx.showSeat.findMany({
          where: { id: { in: showSeatIds } },
          include: { seat: true },
        });
      });

      // Broadcast real-time Socket.IO update
      broadcastSeatUpdate(showId, {
        seatIds: showSeatIds,
        status: 'HELD',
        heldByUserId: userId,
        holdExpiresAt: expiresAt.toISOString(),
      });

      return {
        message: 'Seats held successfully',
        heldSeats: result.map((s) => ({
          id: s.id,
          seatNumber: s.seat.seatNumber,
          category: s.seat.category,
          price: s.price,
        })),
        expiresAt: expiresAt.toISOString(),
        ttlSeconds: env.HOLD_TTL_SECONDS,
      };
    } finally {
      await releaseLock(lockKey);
    }
  }

  /**
   * Release seat holds (on checkout abandonment or explicit release)
   */
  static async releaseSeats(showId: string, showSeatIds: string[], userId: string) {
    const now = new Date();

    const updated = await prisma.showSeat.updateMany({
      where: {
        id: { in: showSeatIds },
        showId,
        heldByUserId: userId,
        status: { in: ['HELD', 'OFFERED'] },
      },
      data: {
        status: 'AVAILABLE',
        heldByUserId: null,
        holdExpiresAt: null,
      },
    });

    if (updated.count > 0) {
      broadcastSeatUpdate(showId, {
        seatIds: showSeatIds,
        status: 'AVAILABLE',
        heldByUserId: null,
        holdExpiresAt: null,
      });
    }

    return { message: 'Seats released', releasedCount: updated.count };
  }
}
