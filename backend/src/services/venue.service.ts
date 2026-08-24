import { prisma } from '../db/prisma.js';

export interface SeatLayoutItem {
  rowLabel: string;
  colNumber: number;
  category: 'VIP' | 'PREMIUM' | 'STANDARD';
  disabled?: boolean;
}

export class VenueService {
  static async createVenue(data: {
    name: string;
    address: string;
    city: string;
    rowCount?: number;
    colCount?: number;
    customSeats?: SeatLayoutItem[];
  }) {
    const rowCount = data.rowCount || 8;
    const colCount = data.colCount || 10;

    const venue = await prisma.venue.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        rowCount,
        colCount,
        layoutJson: JSON.stringify(data.customSeats || []),
      },
    });

    // Generate seats for this venue
    const seatsToCreate: Array<{
      venueId: string;
      rowLabel: string;
      colNumber: number;
      seatNumber: string;
      category: string;
    }> = [];

    const customSeatsMap = new Map<string, SeatLayoutItem>();
    if (data.customSeats) {
      data.customSeats.forEach((cs) => {
        customSeatsMap.set(`${cs.rowLabel}-${cs.colNumber}`, cs);
      });
    }

    const rowAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let r = 0; r < rowCount; r++) {
      const rowLabel = rowAlphabet[r] || `R${r + 1}`;
      for (let c = 1; c <= colCount; c++) {
        const key = `${rowLabel}-${c}`;
        const custom = customSeatsMap.get(key);
        if (custom?.disabled) continue;

        let category = 'STANDARD';
        if (custom) {
          category = custom.category;
        } else {
          // Default logic: First row VIP, next 2 rows PREMIUM, rest STANDARD
          if (r === 0) category = 'VIP';
          else if (r <= 2) category = 'PREMIUM';
          else category = 'STANDARD';
        }

        seatsToCreate.push({
          venueId: venue.id,
          rowLabel,
          colNumber: c,
          seatNumber: `${rowLabel}${c}`,
          category,
        });
      }
    }

    await prisma.seat.createMany({
      data: seatsToCreate,
    });

    return this.getVenueById(venue.id);
  }

  static async getAllVenues() {
    return prisma.venue.findMany({
      include: {
        _count: { select: { seats: true, shows: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getVenueById(id: string) {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        seats: {
          orderBy: [{ rowLabel: 'asc' }, { colNumber: 'asc' }],
        },
      },
    });
    if (!venue) {
      throw { statusCode: 404, message: 'Venue not found' };
    }
    return venue;
  }
}
