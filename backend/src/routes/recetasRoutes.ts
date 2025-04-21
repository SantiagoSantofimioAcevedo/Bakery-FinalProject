import { Router } from 'express';
import { Request, Response } from 'express';
import {  
  upload,
  createReceta, 
  getAllRecetas, 
  getRecetaById, 
  updateReceta, 
  deleteReceta,
  prepararReceta, 
  checkInventory,
  getDisponibilidadReceta
} from '../controllers/recetasController';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.get('/',asyncHandler(getAllRecetas));
router.get('/:id',asyncHandler (getRecetaById));
router.post('/', authMiddleware, upload.single('imagen'), asyncHandler(createReceta));
router.put('/:id', authMiddleware, upload.single('imagen'), asyncHandler(updateReceta));
router.delete('/:id', authMiddleware, asyncHandler(deleteReceta));
router.get('/:id/check-inventory', authMiddleware, asyncHandler(checkInventory));
router.post('/:id/preparar', authMiddleware, asyncHandler(prepararReceta));
router.get('/:id/disponibilidad', authMiddleware, asyncHandler(getDisponibilidadReceta));

export default router;
