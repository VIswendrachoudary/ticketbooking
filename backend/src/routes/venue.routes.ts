import { Router } from 'express';
import { VenueController } from '../controllers/venue.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', VenueController.getVenues);
router.get('/:id', VenueController.getVenue);
router.post('/', authenticate, authorize(['ADMIN', 'ORGANISER']), VenueController.createVenue);

export default router;
