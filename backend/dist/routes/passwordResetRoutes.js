"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passwordResetController_1 = require("../controllers/passwordResetController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Ruta para solicitar recuperación de contraseña
router.post('/request-reset', (0, asyncHandler_1.asyncHandler)(passwordResetController_1.requestPasswordReset));
// Ruta para restablecer la contraseña
router.post('/reset', (0, asyncHandler_1.asyncHandler)(passwordResetController_1.resetPassword));
exports.default = router;
//# sourceMappingURL=passwordResetRoutes.js.map