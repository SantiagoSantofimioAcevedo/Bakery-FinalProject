import { Router } from 'express';
import { registrarIngreso, obtenerHistorialIngresos, obtenerTodosLosIngresos, editarIngreso, eliminarIngreso } from '../controllers/ingresoController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Ruta para registrar un nuevo ingreso
router.post('/', asyncHandler(registrarIngreso));

// Ruta para obtener el historial de ingresos de una materia prima específica
router.get('/materia-prima/:materiaPrimaId', asyncHandler(obtenerHistorialIngresos));

// Ruta para obtener todos los ingresos con filtros
router.get('/', asyncHandler(obtenerTodosLosIngresos));

// Ruta para editar un ingreso existente
router.put('/:id', asyncHandler(editarIngreso));

// Ruta para eliminar un ingreso
router.delete('/:id', asyncHandler(eliminarIngreso));

export default router; 