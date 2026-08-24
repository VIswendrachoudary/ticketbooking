import { Response, NextFunction } from 'express';
import { WaitlistService } from '../services/waitlist.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class WaitlistController {
  static async joinWaitlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { showId, category } = req.body;
      if (!showId || !category) {
        return res.status(400).json({ error: 'ShowId and category are required' });
      }

      const result = await WaitlistService.joinWaitlist(showId, category, req.user.id);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getOfferDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const offerToken = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      const offer = await WaitlistService.getOfferByToken(offerToken);
      res.json(offer);
    } catch (err) {
      next(err);
    }
  }

  static async claimOffer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const offerToken = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      const result = await WaitlistService.claimWaitlistOffer(offerToken, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getUserWaitlists(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const waitlists = await WaitlistService.getUserWaitlists(req.user.id);
      res.json(waitlists);
    } catch (err) {
      next(err);
    }
  }
}
