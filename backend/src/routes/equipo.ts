import { Router } from 'express';
import { getTeamMembers, updateTeamMember, deleteTeamMember } from '../controllers/equipoController';
import { verifyToken, isAdmin } from '../middleware/auth';

const router = Router();

// Rutas protegidas que requieren autenticación y rol de administrador
router.get('/', [verifyToken, isAdmin], getTeamMembers);
router.put('/:id', [verifyToken, isAdmin], updateTeamMember);
router.delete('/:id', [verifyToken, isAdmin], deleteTeamMember);

export default router; 