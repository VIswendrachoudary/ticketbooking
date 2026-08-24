import { Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class EventController {
  static async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { title, description, category, durationMinutes, posterUrl, bannerUrl } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      const event = await EventService.createEvent({
        title,
        description,
        category,
        durationMinutes,
        posterUrl,
        bannerUrl,
        organiserId: req.user.id,
      });

      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  }

  static async createShow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId, venueId, startTime, endTime, vipPrice, premiumPrice, standardPrice } = req.body;
      if (!eventId || !venueId || !startTime) {
        return res.status(400).json({ error: 'EventId, venueId, and startTime are required' });
      }

      const show = await EventService.createShow({
        eventId,
        venueId,
        startTime,
        endTime,
        vipPrice,
        premiumPrice,
        standardPrice,
      });

      res.status(201).json(show);
    } catch (err) {
      next(err);
    }
  }

  static async getEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, search, organiserId } = req.query;
      const events = await EventService.getEvents({
        category: category as string,
        search: search as string,
        organiserId: organiserId as string,
      });
      res.json(events);
    } catch (err) {
      next(err);
    }
  }

  static async getEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await EventService.getEventById(eventId);
      res.json(event);
    } catch (err) {
      next(err);
    }
  }

  static async getShow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const showId = Array.isArray(req.params.showId) ? req.params.showId[0] : req.params.showId;
      const show = await EventService.getShowById(showId);
      res.json(show);
    } catch (err) {
      next(err);
    }
  }
}
