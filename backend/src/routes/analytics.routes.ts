import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/organiser', authenticate, authorize(['ADMIN', 'ORGANISER']), AnalyticsController.getOrganiserAnalytics);
router.get('/admin', authenticate, authorize(['ADMIN']), AnalyticsController.getAdminStats);

export default router;
