import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe, logout } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Proteksi brute force pada endpoint login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
  },
});

/** POST /api/auth/login — Public */
router.post('/login', loginLimiter, login as unknown as RequestHandler);

/** GET /api/auth/me — Authenticated */
router.get('/me', authMiddleware as unknown as RequestHandler, getMe as unknown as RequestHandler);

/** POST /api/auth/logout — Authenticated */
router.post('/logout', authMiddleware as unknown as RequestHandler, logout as unknown as RequestHandler);

export default router;
