"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ingresoController_1 = require("../controllers/ingresoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authMiddleware);
// Ruta para registrar un nuevo ingreso
router.post('/', (0, asyncHandler_1.asyncHandler)(ingresoController_1.registrarIngreso));
// Ruta para obtener el historial de ingresos de una materia prima específica
router.get('/materia-prima/:materiaPrimaId', (0, asyncHandler_1.asyncHandler)(ingresoController_1.obtenerHistorialIngresos));
// Ruta para obtener todos los ingresos con filtros
router.get('/', (0, asyncHandler_1.asyncHandler)(ingresoController_1.obtenerTodosLosIngresos));
// Ruta para editar un ingreso existente
router.put('/:id', (0, asyncHandler_1.asyncHandler)(ingresoController_1.editarIngreso));
// Ruta para eliminar un ingreso
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(ingresoController_1.eliminarIngreso));
exports.default = router;
//# sourceMappingURL=ingresoRoutes.js.map