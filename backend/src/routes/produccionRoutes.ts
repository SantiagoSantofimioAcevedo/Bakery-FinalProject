import { Router } from 'express';
import { getAllProducciones, getProduccionById, getProduccionesPorFecha} from '../controllers/produccionController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Obtener todas las producciones
router.get('/', asyncHandler(getAllProducciones));

// Obtener una producción por ID
router.get('/:id', asyncHandler(getProduccionById));

// Obtener producciones por fecha
router.get('/fecha/:fecha', asyncHandler(getProduccionesPorFecha));

export default router;
