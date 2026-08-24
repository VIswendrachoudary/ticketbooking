import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/checkout', authenticate, BookingController.checkout);
router.get('/my-bookings', authenticate, BookingController.getUserBookings);
router.post('/cancel/:id', authenticate, BookingController.cancelBooking);

export default router;
