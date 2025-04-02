"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/ventasRoutes.ts
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const ventasController_1 = require("../controllers/ventasController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/ventas', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ventasController_1.getAllVentas));
router.get('/ventas/:id', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ventasController_1.getVentaById));
router.post('/ventas', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ventasController_1.createVenta));
router.put('/ventas/:id/anular', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ventasController_1.anularVenta));
exports.default = router;
