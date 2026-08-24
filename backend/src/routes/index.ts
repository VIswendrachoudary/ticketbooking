import { Router } from 'express';
import authRoutes from './auth.routes.js';
import venueRoutes from './venue.routes.js';
import eventRoutes from './event.routes.js';
import seatRoutes from './seat.routes.js';
import bookingRoutes from './booking.routes.js';
import waitlistRoutes from './waitlist.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/venues', venueRoutes);
router.use('/events', eventRoutes);
router.use('/seats', seatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
