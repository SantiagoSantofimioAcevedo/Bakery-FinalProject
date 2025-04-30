"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const passwordResetController_1 = require("../controllers/passwordResetController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Rutas públicas
router.post('/login', (0, asyncHandler_1.asyncHandler)(authController_1.login));
router.post('/verify-admin', (0, asyncHandler_1.asyncHandler)(authController_1.verifyAdmin));
router.post('/request-password-reset', (0, asyncHandler_1.asyncHandler)(passwordResetController_1.requestPasswordReset));
router.post('/reset-password', (0, asyncHandler_1.asyncHandler)(passwordResetController_1.resetPassword));
// Ruta de registro ahora protegida (solo para administradores)
router.post('/register', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, (0, asyncHandler_1.asyncHandler)(authController_1.register));
// Rutas protegidas
router.get('/me', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(authController_1.getCurrentUser));
exports.default = router;
//# sourceMappingURL=auth.js.map