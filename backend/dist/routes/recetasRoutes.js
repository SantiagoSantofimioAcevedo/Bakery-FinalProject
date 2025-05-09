"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recetasController_1 = require("../controllers/recetasController");
const asyncHandler_1 = require("../utils/asyncHandler");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', (0, asyncHandler_1.asyncHandler)(recetasController_1.getAllRecetas));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(recetasController_1.getRecetaById));
router.post('/', authMiddleware_1.authMiddleware, recetasController_1.upload.single('imagen'), (0, asyncHandler_1.asyncHandler)(recetasController_1.createReceta));
router.put('/:id', authMiddleware_1.authMiddleware, recetasController_1.upload.single('imagen'), (0, asyncHandler_1.asyncHandler)(recetasController_1.updateReceta));
router.delete('/:id', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(recetasController_1.deleteReceta));
router.get('/:id/check-inventory', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(recetasController_1.checkInventory));
router.post('/:id/preparar', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(recetasController_1.prepararReceta));
router.get('/:id/disponibilidad', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(recetasController_1.getDisponibilidadReceta));
exports.default = router;
//# sourceMappingURL=recetasRoutes.js.map