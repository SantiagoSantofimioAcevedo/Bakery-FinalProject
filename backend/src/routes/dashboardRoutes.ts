import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

router.get('/', asyncHandler(getDashboardData));

export default router; 