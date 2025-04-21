import express from 'express';
import { 
  getReporteVentas, 
  getReporteInventario, 
  getReporteProduccion, 
  getReporteConsumoMateriasPrimas,
  getDashboardData
} from '../controllers/reportesController';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { validarFechas } from '../middleware/validarFechas';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = express.Router();

// Aplicar middleware de autenticación y administrador a todas las rutas
router.use(authMiddleware);
router.use(adminMiddleware);

// Ruta para el dashboard del módulo de reportes
router.get('/dashboard', asyncHandler(getDashboardData));

// Rutas para reportes con fechas
router.get('/ventas', validarFechas, asyncHandler(getReporteVentas));
router.get('/produccion', validarFechas, asyncHandler(getReporteProduccion));
router.get('/materias-primas', validarFechas, asyncHandler(getReporteConsumoMateriasPrimas));

// Ruta para reporte de inventario (no requiere fechas)
router.get('/inventario', asyncHandler(getReporteInventario));

export default router; 