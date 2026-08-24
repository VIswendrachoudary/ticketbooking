import { prisma } from '../db/prisma.js';
import { broadcastSeatUpdate } from '../socket.js';
import { WaitlistService } from '../services/waitlist.service.js';

let isRunning = false;

export function startTtlWorker(intervalMs = 5000) {
  console.log(`⏰ Starting Seat Hold & Waitlist TTL Worker (Interval: ${intervalMs}ms)...`);

  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const now = new Date();

      // 1. Find expired seat holds (status === 'HELD' and holdExpiresAt <= NOW())
      const expiredHolds = await prisma.showSeat.findMany({
        where: {
          status: 'HELD',
          holdExpiresAt: { lte: now },
        },
        include: { seat: true },
      });

      if (expiredHolds.length > 0) {
        console.log(`🧹 Found ${expiredHolds.length} expired seat holds to release/reallocate.`);

        for (const expiredSeat of expiredHolds) {
          // Check if there is a waitlist entry for this show and category
          const waitlistExists = await prisma.waitlist.findFirst({
            where: {
              showId: expiredSeat.showId,
              category: expiredSeat.seat.category,
              status: 'WAITING',
            },
          });

          if (waitlistExists) {
            console.log(`🔀 Expired seat ${expiredSeat.seat.seatNumber} has active waitlist candidates. Auto-offering...`);
            await WaitlistService.processWaitlistForSeat(
              expiredSeat.showId,
              expiredSeat.seat.category,
              expiredSeat.id
            );
          } else {
            // No waitlist candidates -> release back to AVAILABLE
            await prisma.showSeat.update({
              where: { id: expiredSeat.id },
              data: {
                status: 'AVAILABLE',
                heldByUserId: null,
                holdExpiresAt: null,
              },
            });

            broadcastSeatUpdate(expiredSeat.showId, {
              seatIds: [expiredSeat.id],
              status: 'AVAILABLE',
              heldByUserId: null,
              holdExpiresAt: null,
            });
          }
        }
      }

      // 2. Expire stale waitlist offers (status === 'OFFERED' and offerExpiresAt <= NOW())
      await WaitlistService.expireWaitlistOffers();

    } catch (err: any) {
      console.error('Error in TTL worker loop:', err.message);
    } finally {
      isRunning = false;
    }
  }, intervalMs);
}
