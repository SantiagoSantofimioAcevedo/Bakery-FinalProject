"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuariosController_1 = require("../controllers/usuariosController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación y administrador a todas las rutas
router.use(authMiddleware_1.authMiddleware);
router.use(adminMiddleware_1.adminMiddleware);
// Rutas de usuarios
router.get('/', (0, asyncHandler_1.asyncHandler)(usuariosController_1.getAllUsers));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(usuariosController_1.getUserById));
router.put('/:id', (0, asyncHandler_1.asyncHandler)(usuariosController_1.updateUser));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(usuariosController_1.deleteUser));
exports.default = router;
//# sourceMappingURL=usuariosRoutes.js.map