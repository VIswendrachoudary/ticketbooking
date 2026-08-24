import { Router } from 'express';
import { SeatController } from '../controllers/seat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/map/:showId', SeatController.getSeatMap);
router.post('/hold', authenticate, SeatController.holdSeats);
router.post('/release', authenticate, SeatController.releaseSeats);

export default router;
