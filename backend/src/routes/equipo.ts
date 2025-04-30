import { Router } from 'express';
import { getTeamMembers, updateTeamMember, deleteTeamMember } from '../controllers/equipoController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// Rutas protegidas que requieren autenticación y rol de administrador
router.get('/', [authMiddleware, adminMiddleware], getTeamMembers);
router.put('/:id', [authMiddleware, adminMiddleware], updateTeamMember);
router.delete('/:id', [authMiddleware, adminMiddleware], deleteTeamMember);

export default router; 