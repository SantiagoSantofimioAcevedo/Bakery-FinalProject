"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const produccionController_1 = require("../controllers/produccionController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Obtener todas las producciones
router.get('/', (0, asyncHandler_1.asyncHandler)(produccionController_1.getAllProducciones));
// Obtener una producción por ID
router.get('/:id', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionById));
// Obtener producciones por fecha
router.get('/fecha/:fecha', (0, asyncHandler_1.asyncHandler)(produccionController_1.getProduccionesPorFecha));
exports.default = router;
