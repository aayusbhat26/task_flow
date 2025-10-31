import { Router } from 'express';
import { completeOnboarding } from '../controllers/onboarding.controller';

const router = Router();

// Complete onboarding
router.post('/', completeOnboarding);

export default router;
