import { Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export class AnalyticsController {
  static async getOrganiserAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      // Find all events created by this organiser (or all if ADMIN)
      const isOrganiser = req.user.role === 'ORGANISER';

      const events = await prisma.event.findMany({
        where: isOrganiser ? { organiserId: req.user.id } : {},
        include: {
          shows: {
            include: {
              venue: true,
              bookings: {
                where: { status: 'CONFIRMED' },
                include: { items: { include: { showSeat: { include: { seat: true } } } } },
              },
              waitlists: { where: { status: 'WAITING' } },
              _count: { select: { showSeats: true } },
            },
          },
        },
      });

      let totalRevenue = 0;
      let totalTicketsSold = 0;

      const eventSummaries = events.map((event) => {
        let eventRevenue = 0;
        let eventTicketsSold = 0;

        const showSummaries = event.shows.map((show) => {
          let showRevenue = 0;
          let showTicketsSold = 0;
          const categorySales: Record<string, { count: number; revenue: number }> = {
            VIP: { count: 0, revenue: 0 },
            PREMIUM: { count: 0, revenue: 0 },
            STANDARD: { count: 0, revenue: 0 },
          };

          show.bookings.forEach((booking) => {
            showRevenue += booking.totalPrice;
            booking.items.forEach((item) => {
              showTicketsSold += 1;
              const cat = item.showSeat.seat.category;
              if (!categorySales[cat]) categorySales[cat] = { count: 0, revenue: 0 };
              categorySales[cat].count += 1;
              categorySales[cat].revenue += item.seatPrice;
            });
          });

          eventRevenue += showRevenue;
          eventTicketsSold += showTicketsSold;

          const totalSeats = show._count.showSeats;
          const occupancyRate = totalSeats > 0 ? (showTicketsSold / totalSeats) * 100 : 0;

          return {
            showId: show.id,
            startTime: show.startTime,
            venueName: show.venue.name,
            totalSeats,
            ticketsSold: showTicketsSold,
            occupancyRate: Math.round(occupancyRate * 10) / 10,
            revenue: showRevenue,
            waitlistLength: show.waitlists.length,
            categorySales,
          };
        });

        totalRevenue += eventRevenue;
        totalTicketsSold += eventTicketsSold;

        return {
          eventId: event.id,
          title: event.title,
          category: event.category,
          totalShows: event.shows.length,
          eventRevenue,
          eventTicketsSold,
          shows: showSummaries,
        };
      });

      res.json({
        totalEvents: events.length,
        totalRevenue,
        totalTicketsSold,
        events: eventSummaries,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalVenues, totalEvents, totalShows, totalBookings, confirmedBookings] = await Promise.all([
        prisma.user.count(),
        prisma.venue.count(),
        prisma.event.count(),
        prisma.show.count(),
        prisma.booking.count(),
        prisma.booking.findMany({ where: { status: 'CONFIRMED' } }),
      ]);

      const totalPlatformRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

      res.json({
        totalUsers,
        totalVenues,
        totalEvents,
        totalShows,
        totalBookings,
        totalPlatformRevenue,
      });
    } catch (err) {
      next(err);
    }
  }
}
