import { Response, NextFunction } from 'express';
import { VenueService } from '../services/venue.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class VenueController {
  static async createVenue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, address, city, rowCount, colCount, customSeats } = req.body;
      if (!name || !address || !city) {
        return res.status(400).json({ error: 'Name, address, and city are required' });
      }
      const venue = await VenueService.createVenue({
        name,
        address,
        city,
        rowCount,
        colCount,
        customSeats,
      });
      res.status(201).json(venue);
    } catch (err) {
      next(err);
    }
  }

  static async getVenues(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const venues = await VenueService.getAllVenues();
      res.json(venues);
    } catch (err) {
      next(err);
    }
  }

  static async getVenue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const venueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const venue = await VenueService.getVenueById(venueId);
      res.json(venue);
    } catch (err) {
      next(err);
    }
  }
}
