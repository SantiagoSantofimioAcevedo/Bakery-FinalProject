"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const authMiddleware_1 = require("../middleware/authMiddleware");
const materiaPrimaController_1 = require("../controllers/materiaPrimaController");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authMiddleware);
router.get('/materias-primas', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.getAllMateriasPrimas));
router.get('/materias-primas/bajo-stock', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.getLowStock));
router.get('/materias-primas/:id', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.getMateriaPrimaById));
router.post('/materias-primas', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.createMateriaPrima));
router.put('/materias-primas/:id', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.updateMateriaPrima));
router.delete('/materias-primas/:id', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.deleteMateriaPrima));
router.patch('/materias-primas/:id/ajustar-stock', (0, asyncHandler_1.asyncHandler)(materiaPrimaController_1.adjustStock));
exports.default = router;
