"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, asyncHandler_1.asyncHandler)(dashboardController_1.getDashboardData));
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map