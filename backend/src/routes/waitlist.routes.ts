import { Router } from 'express';
import { WaitlistController } from '../controllers/waitlist.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/join', authenticate, WaitlistController.joinWaitlist);
router.get('/my-waitlists', authenticate, WaitlistController.getUserWaitlists);
router.get('/offer/:token', WaitlistController.getOfferDetails);
router.post('/offer/:token/claim', authenticate, WaitlistController.claimOffer);

export default router;
