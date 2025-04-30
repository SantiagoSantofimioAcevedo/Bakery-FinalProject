"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/ventasRoutes.ts
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const ventasController_1 = require("../controllers/ventasController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authMiddleware);
// Rutas de ventas
router.get('/ventas', (0, asyncHandler_1.asyncHandler)(ventasController_1.getAllVentas));
router.get('/ventas/diarias', (0, asyncHandler_1.asyncHandler)(ventasController_1.getVentasDiarias));
router.get('/ventas/semanales', (0, asyncHandler_1.asyncHandler)(ventasController_1.getVentasSemanales));
router.get('/ventas/mensuales', (0, asyncHandler_1.asyncHandler)(ventasController_1.getVentasMensuales));
router.get('/ventas/rango', (0, asyncHandler_1.asyncHandler)(ventasController_1.getVentasPorRango));
router.get('/ventas/:id', (0, asyncHandler_1.asyncHandler)(ventasController_1.getVentaById));
router.post('/ventas', (0, asyncHandler_1.asyncHandler)(ventasController_1.createVenta));
router.put('/ventas/:id', (0, asyncHandler_1.asyncHandler)(ventasController_1.updateVenta));
router.put('/ventas/:id/anular', (0, asyncHandler_1.asyncHandler)(ventasController_1.anularVenta));
router.delete('/ventas/:id', (0, asyncHandler_1.asyncHandler)(ventasController_1.deleteVenta));
exports.default = router;
//# sourceMappingURL=ventasRoutes.js.map