import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/usuariosController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Aplicar middleware de autenticación y administrador a todas las rutas
router.use(authMiddleware);
router.use(adminMiddleware);

// Rutas de usuarios
router.get('/', asyncHandler(getAllUsers));
router.get('/:id', asyncHandler(getUserById));
router.put('/:id', asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

export default router; 