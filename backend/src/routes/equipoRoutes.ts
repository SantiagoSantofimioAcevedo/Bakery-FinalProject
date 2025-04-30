import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import {
  getTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember,
  createTeamMember
} from '../controllers/equipoController';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authMiddleware);
router.use(adminMiddleware);

// Rutas para gestión de equipo
router.get('/', async (req: Request, res: Response) => {
  await getTeamMembers(req, res);
});

router.get('/:id', async (req: Request, res: Response) => {
  await getTeamMember(req, res);
});

router.put('/:id', async (req: Request, res: Response) => {
  await updateTeamMember(req, res);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await deleteTeamMember(req, res);
});

// Ruta para crear un nuevo miembro del equipo
router.post('/crear', async (req: Request, res: Response) => {
  await createTeamMember(req, res);
});

export default router; 