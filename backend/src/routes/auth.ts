import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;


