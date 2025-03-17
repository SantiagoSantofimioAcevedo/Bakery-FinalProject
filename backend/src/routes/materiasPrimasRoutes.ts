import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getAllMateriasPrimas,getMateriaPrimaById,createMateriaPrima,updateMateriaPrima,deleteMateriaPrima,adjustStock,getLowStock} from '../controllers/materiaPrimaController';

const router = Router();

router.get('/materias-primas', asyncHandler(getAllMateriasPrimas));
router.get('/materias-primas/bajo-stock', asyncHandler(getLowStock));
router.get('/materias-primas/:id', asyncHandler(getMateriaPrimaById));
router.post('/materias-primas', asyncHandler(createMateriaPrima));
router.put('/materias-primas/:id', asyncHandler(updateMateriaPrima));
router.delete('/materias-primas/:id', asyncHandler(deleteMateriaPrima));
router.patch('/materias-primas/:id/ajustar-stock', asyncHandler(adjustStock));

export default router;

