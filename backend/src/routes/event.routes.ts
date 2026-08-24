import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', EventController.getEvents);
router.get('/:id', EventController.getEvent);
router.get('/shows/:showId', EventController.getShow);
router.post('/', authenticate, authorize(['ADMIN', 'ORGANISER']), EventController.createEvent);
router.post('/shows', authenticate, authorize(['ADMIN', 'ORGANISER']), EventController.createShow);

export default router;
