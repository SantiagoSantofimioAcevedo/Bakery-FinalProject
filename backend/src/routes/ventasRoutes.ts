// src/routes/ventasRoutes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getAllVentas, getVentaById, createVenta, anularVenta, deleteVenta, getVentasDiarias, getVentasSemanales, getVentasPorRango, updateVenta, getVentasMensuales } from '../controllers/ventasController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas de ventas
router.get('/ventas', asyncHandler(getAllVentas));
router.get('/ventas/diarias', asyncHandler(getVentasDiarias));
router.get('/ventas/semanales', asyncHandler(getVentasSemanales));
router.get('/ventas/mensuales', asyncHandler(getVentasMensuales));
router.get('/ventas/rango', asyncHandler(getVentasPorRango));
router.get('/ventas/:id', asyncHandler(getVentaById));
router.post('/ventas', asyncHandler(createVenta));
router.put('/ventas/:id', asyncHandler(updateVenta));
router.put('/ventas/:id/anular', asyncHandler(anularVenta));
router.delete('/ventas/:id', asyncHandler(deleteVenta));

export default router;