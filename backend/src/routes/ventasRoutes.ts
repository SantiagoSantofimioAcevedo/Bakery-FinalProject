// src/routes/ventasRoutes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getAllVentas, getVentaById, createVenta, anularVenta} from '../controllers/ventasController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/ventas', authMiddleware, asyncHandler(getAllVentas));
router.get('/ventas/:id', authMiddleware, asyncHandler(getVentaById));
router.post('/ventas', authMiddleware, asyncHandler(createVenta));
router.put('/ventas/:id/anular', authMiddleware, asyncHandler(anularVenta));

export default router;