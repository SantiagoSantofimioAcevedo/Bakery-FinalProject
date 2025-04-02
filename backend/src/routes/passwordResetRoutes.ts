import { Router } from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Ruta para solicitar recuperación de contraseña
router.post('/request-reset', asyncHandler(requestPasswordReset));

// Ruta para restablecer la contraseña
router.post('/reset', asyncHandler(resetPassword));

export default router; 