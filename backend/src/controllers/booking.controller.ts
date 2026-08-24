import { Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class BookingController {
  static async checkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const showId = req.body.showId;
      const showSeatIds = req.body.showSeatIds || req.body.seatIds;

      if (!showId || !showSeatIds || !Array.isArray(showSeatIds)) {
        return res.status(400).json({ error: 'ShowId and showSeatIds array are required' });
      }

      const booking = await BookingService.checkout(showId, showSeatIds, req.user.id);
      res.status(201).json({ booking });
    } catch (err) {
      next(err);
    }
  }

  static async getUserBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const bookings = await BookingService.getUserBookings(req.user.id);
      res.json(bookings);
    } catch (err) {
      next(err);
    }
  }

  static async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await BookingService.cancelBooking(bookingId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
