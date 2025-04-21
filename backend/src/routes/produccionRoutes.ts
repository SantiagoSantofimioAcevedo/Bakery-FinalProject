import { Router } from 'express';
import { 
  getAllProducciones, 
  getProduccionById, 
  getProduccionesPorFecha, 
  createProduccion,
  getProduccionesDiarias,
  getProduccionesSemanales,
  getProduccionesPorRango
} from '../controllers/produccionController';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Obtener todas las producciones
router.get('/', asyncHandler(getAllProducciones));

// Obtener producciones del día
router.get('/diarias', asyncHandler(getProduccionesDiarias));

// Obtener producciones de la semana
router.get('/semanales', asyncHandler(getProduccionesSemanales));

// Obtener producciones por rango de fechas
router.get('/rango', asyncHandler(getProduccionesPorRango));

// Obtener una producción específica
router.get('/:id', asyncHandler(getProduccionById));

// Obtener producciones por fecha
router.get('/fecha/:fecha', asyncHandler(getProduccionesPorFecha));

// Crear una nueva producción
router.post('/', asyncHandler(createProduccion));

export default router;
