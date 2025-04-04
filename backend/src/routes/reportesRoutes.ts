import { Router } from 'express';
import { 
  getReporteVentas, 
  getReporteInventario, 
  getReporteProduccion, 
  getReporteConsumoMateriasPrimas,
  validarFechas,
  getDashboardData
} from '../controllers/reportesController';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Ruta para el dashboard del módulo de reportes
router.get('/dashboard', asyncHandler(getDashboardData));

// Rutas para reportes con fechas
router.get('/ventas', asyncHandler(validarFechas), asyncHandler(getReporteVentas));
router.get('/produccion', asyncHandler(validarFechas), asyncHandler(getReporteProduccion));
router.get('/materias-primas', asyncHandler(validarFechas), asyncHandler(getReporteConsumoMateriasPrimas));

// Ruta para reporte de inventario (no requiere fechas)
router.get('/inventario', asyncHandler(getReporteInventario));

export default router; 