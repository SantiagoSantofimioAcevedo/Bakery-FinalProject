import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/api/register', asyncHandler(register));
router.post('/api/login', asyncHandler(login));
router.get('/api/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;


