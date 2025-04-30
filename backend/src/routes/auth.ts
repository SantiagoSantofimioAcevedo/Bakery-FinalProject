import { Router } from 'express';
import { login, register, getCurrentUser, verifyAdmin } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Rutas públicas
router.post('/login', asyncHandler(login));
router.post('/verify-admin', asyncHandler(verifyAdmin));
router.post('/request-password-reset', asyncHandler(requestPasswordReset));
router.post('/reset-password', asyncHandler(resetPassword));

// Ruta de registro ahora protegida (solo para administradores)
router.post('/register', authMiddleware, adminMiddleware, asyncHandler(register));

// Rutas protegidas
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;


