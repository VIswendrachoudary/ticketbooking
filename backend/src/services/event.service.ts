import { prisma } from '../db/prisma.js';

export class EventService {
  static async createEvent(data: {
    title: string;
    description: string;
    category?: string;
    durationMinutes?: number;
    posterUrl?: string;
    bannerUrl?: string;
    organiserId: string;
  }) {
    return prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || 'MOVIE',
        durationMinutes: data.durationMinutes || 120,
        posterUrl: data.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
        bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&q=80',
        organiserId: data.organiserId,
      },
    });
  }

  static async createShow(data: {
    eventId: string;
    venueId: string;
    startTime: string | Date;
    endTime?: string | Date;
    vipPrice?: number;
    premiumPrice?: number;
    standardPrice?: number;
  }) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw { statusCode: 404, message: 'Event not found' };

    const venue = await prisma.venue.findUnique({
      where: { id: data.venueId },
      include: { seats: true },
    });
    if (!venue) throw { statusCode: 404, message: 'Venue not found' };

    const start = new Date(data.startTime);
    const end = data.endTime
      ? new Date(data.endTime)
      : new Date(start.getTime() + (event.durationMinutes || 120) * 60 * 1000);

    const vipPrice = data.vipPrice ?? 100.0;
    const premiumPrice = data.premiumPrice ?? 60.0;
    const standardPrice = data.standardPrice ?? 30.0;

    const show = await prisma.show.create({
      data: {
        eventId: data.eventId,
        venueId: data.venueId,
        startTime: start,
        endTime: end,
        vipPrice,
        premiumPrice,
        standardPrice,
      },
    });

    // Populate ShowSeat records for every seat in the venue
    const showSeatsData = venue.seats.map((seat) => {
      let price = standardPrice;
      if (seat.category === 'VIP') price = vipPrice;
      else if (seat.category === 'PREMIUM') price = premiumPrice;

      return {
        showId: show.id,
        seatId: seat.id,
        status: 'AVAILABLE',
        price,
      };
    });

    await prisma.showSeat.createMany({
      data: showSeatsData,
    });

    return this.getShowById(show.id);
  }

  static async getEvents(filters: {
    category?: string;
    search?: string;
    organiserId?: string;
  }) {
    const where: any = {};
    if (filters.category) {
      where.category = filters.category.toUpperCase();
    }
    if (filters.organiserId) {
      where.organiserId = filters.organiserId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return prisma.event.findMany({
      where,
      include: {
        organiser: { select: { id: true, name: true, email: true } },
        shows: {
          include: {
            venue: { select: { id: true, name: true, city: true } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organiser: { select: { id: true, name: true, email: true } },
        shows: {
          include: {
            venue: { select: { id: true, name: true, city: true, rowCount: true, colCount: true } },
            _count: { select: { showSeats: true } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });
    if (!event) throw { statusCode: 404, message: 'Event not found' };
    return event;
  }

  static async getShowById(showId: string) {
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
    return show;
  }
}
