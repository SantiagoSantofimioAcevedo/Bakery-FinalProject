"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const produccionController_1 = require("../controllers/produccionController");
const asyncHandler_1 = require("../utils/asyncHandler");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authMiddleware);
// Obtener todas las producciones
router.get('/', (0, asyncHandler_1.asyncHandler)(produccionController_1.getAllProducciones));
// Obtener producciones del día
router.get('/diarias', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionesDiarias));
// Obtener producciones de la semana
router.get('/semanales', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionesSemanales));
// Obtener producciones por rango de fechas
router.get('/rango', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionesPorRango));
// Obtener una producción específica
router.get('/:id', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionById));
// Obtener producciones por fecha
router.get('/fecha/:fecha', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionesPorFecha));
// Crear una nueva producción
router.post('/', (0, asyncHandler_1.asyncHandler)(produccionController_1.createProduccion));
exports.default = router;
//# sourceMappingURL=produccionRoutes.js.map