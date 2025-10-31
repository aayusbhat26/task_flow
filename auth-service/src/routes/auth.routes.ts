import { Router } from 'express';
import { register, login, callback, providers } from '../controllers/auth.controller';

const router = Router();

// Registration endpoint
router.post('/register', register);

// Login endpoint
router.post('/login', login);

// OAuth callback endpoint
router.get('/callback/:provider', callback);

// Get available providers
router.get('/providers', providers);

export default router;
