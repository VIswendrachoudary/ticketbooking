import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed process...');

  // 1. Clean existing records
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.showSeat.deleteMany();
  await prisma.show.deleteMany();
  await prisma.event.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tickets.com',
      password: passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const organiser = await prisma.user.create({
    data: {
      email: 'organiser@cinema.com',
      password: passwordHash,
      name: 'Apex Entertainment Org',
      role: 'ORGANISER',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@gmail.com',
      password: passwordHash,
      name: 'Alice Johnson',
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@gmail.com',
      password: passwordHash,
      name: 'Bob Smith',
      role: 'CUSTOMER',
    },
  });

  console.log('✅ Created default users:');
  console.log('   - ADMIN: admin@tickets.com / password123');
  console.log('   - ORGANISER: organiser@cinema.com / password123');
  console.log('   - CUSTOMER 1: customer1@gmail.com / password123');
  console.log('   - CUSTOMER 2: customer2@gmail.com / password123');

  // 3. Create Venues and Seats
  const venue1 = await prisma.venue.create({
    data: {
      name: 'Grand IMAX Cinema',
      address: '777 Broadway Ave, Manhattan',
      city: 'New York',
      rowCount: 6,
      colCount: 8,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'Royal Arena Stadium',
      address: '100 Olympic Way',
      city: 'London',
      rowCount: 8,
      colCount: 10,
    },
  });

  const createSeatsForVenue = async (venueId: string, rowCount: number, colCount: number) => {
    const seatsToCreate = [];
    const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < rowCount; r++) {
      const rowLabel = rows[r];
      for (let c = 1; c <= colCount; c++) {
        let category = 'STANDARD';
        if (r === 0) category = 'VIP';
        else if (r <= 2) category = 'PREMIUM';

        seatsToCreate.push({
          venueId,
          rowLabel,
          colNumber: c,
          seatNumber: `${rowLabel}${c}`,
          category,
        });
      }
    }
    await prisma.seat.createMany({ data: seatsToCreate });
  };

  await createSeatsForVenue(venue1.id, 6, 8);
  await createSeatsForVenue(venue2.id, 8, 10);
  console.log('✅ Created 2 Venues with seat grid layouts.');

  // 4. Create Events
  const event1 = await prisma.event.create({
    data: {
      title: 'Inception: 15th Anniversary Re-Release',
      description: 'Experience Christopher Nolan’s mind-bending masterpiece in IMAX 70mm.',
      category: 'MOVIE',
      durationMinutes: 148,
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
      organiserId: organiser.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Coldplay: Music of the Spheres World Tour',
      description: 'Live performance with spectacular visuals, lights, and iconic hits.',
      category: 'CONCERT',
      durationMinutes: 150,
      posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
      organiserId: organiser.id,
    },
  });

  console.log('✅ Created 2 Events.');

  // 5. Create Shows & Populate ShowSeats
  const now = new Date();
  const showTime1 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const showTime2 = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Day after tomorrow

  const show1 = await prisma.show.create({
    data: {
      eventId: event1.id,
      venueId: venue1.id,
      startTime: showTime1,
      endTime: new Date(showTime1.getTime() + 148 * 60 * 1000),
      vipPrice: 120.0,
      premiumPrice: 85.0,
      standardPrice: 45.0,
    },
  });

  const show2 = await prisma.show.create({
    data: {
      eventId: event2.id,
      venueId: venue2.id,
      startTime: showTime2,
      endTime: new Date(showTime2.getTime() + 150 * 60 * 1000),
      vipPrice: 250.0,
      premiumPrice: 150.0,
      standardPrice: 90.0,
    },
  });

  // Populate ShowSeats for show1
  const venue1Seats = await prisma.seat.findMany({ where: { venueId: venue1.id } });
  await prisma.showSeat.createMany({
    data: venue1Seats.map((s) => ({
      showId: show1.id,
      seatId: s.id,
      status: 'AVAILABLE',
      price: s.category === 'VIP' ? 120.0 : s.category === 'PREMIUM' ? 85.0 : 45.0,
    })),
  });

  // Populate ShowSeats for show2
  const venue2Seats = await prisma.seat.findMany({ where: { venueId: venue2.id } });
  await prisma.showSeat.createMany({
    data: venue2Seats.map((s) => ({
      showId: show2.id,
      seatId: s.id,
      status: 'AVAILABLE',
      price: s.category === 'VIP' ? 250.0 : s.category === 'PREMIUM' ? 150.0 : 90.0,
    })),
  });

  console.log('✅ Created Shows and populated ShowSeats.');

  // 6. Pre-book some VIP seats for show1 so VIP category is SOLD OUT for waitlist testing!
  const vipSeatsShow1 = await prisma.showSeat.findMany({
    where: {
      showId: show1.id,
      seat: { category: 'VIP' },
    },
  });

  if (vipSeatsShow1.length > 0) {
    const bookingRef = 'TKT-2026-SEEDVIP1';
    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        userId: customer1.id,
        showId: show1.id,
        totalPrice: vipSeatsShow1.reduce((sum, s) => sum + s.price, 0),
        status: 'CONFIRMED',
        items: {
          create: vipSeatsShow1.map((s) => ({
            showSeatId: s.id,
            seatPrice: s.price,
          })),
        },
      },
    });

    await prisma.showSeat.updateMany({
      where: { id: { in: vipSeatsShow1.map((s) => s.id) } },
      data: { status: 'BOOKED' },
    });

    console.log(`✅ Pre-booked ${vipSeatsShow1.length} VIP seats for Show 1 (Ref: ${bookingRef}) to test Waitlist promotion!`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
