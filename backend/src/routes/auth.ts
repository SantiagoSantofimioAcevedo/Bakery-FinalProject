import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Rutas públicas
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/request-password-reset', asyncHandler(requestPasswordReset));
router.post('/reset-password', asyncHandler(resetPassword));

// Rutas protegidas
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;


