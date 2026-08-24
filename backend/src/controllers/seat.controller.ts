import { Response, NextFunction } from 'express';
import { SeatService } from '../services/seat.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class SeatController {
  static async getSeatMap(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const showId = Array.isArray(req.params.showId) ? req.params.showId[0] : req.params.showId;
      const userId = req.user?.id;
      const seatMap = await SeatService.getShowSeatMap(showId, userId);
      res.json(seatMap);
    } catch (err) {
      next(err);
    }
  }

  static async holdSeats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const showId = req.body.showId;
      const showSeatIds = req.body.showSeatIds || req.body.seatIds;

      if (!showId || !showSeatIds || !Array.isArray(showSeatIds)) {
        return res.status(400).json({ error: 'ShowId and showSeatIds array are required' });
      }

      const result = await SeatService.holdSeats(showId, showSeatIds, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async releaseSeats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const showId = req.body.showId;
      const showSeatIds = req.body.showSeatIds || req.body.seatIds;

      if (!showId || !showSeatIds || !Array.isArray(showSeatIds)) {
        return res.status(400).json({ error: 'ShowId and showSeatIds array are required' });
      }

      const result = await SeatService.releaseSeats(showId, showSeatIds, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
