import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }
      const result = await AuthService.register({ email, password, name, role });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const result = await AuthService.login({ email, password });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const user = await AuthService.getProfile(req.user.id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
}
