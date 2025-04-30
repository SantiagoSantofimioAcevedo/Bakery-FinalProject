"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportesController_1 = require("../controllers/reportesController");
const asyncHandler_1 = require("../utils/asyncHandler");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validarFechas_1 = require("../middleware/validarFechas");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const router = express_1.default.Router();
// Aplicar middleware de autenticación y administrador a todas las rutas
router.use(authMiddleware_1.authMiddleware);
router.use(adminMiddleware_1.adminMiddleware);
// Ruta para el dashboard del módulo de reportes
router.get('/dashboard', (0, asyncHandler_1.asyncHandler)(reportesController_1.getDashboardData));
// Rutas para reportes con fechas
router.get('/ventas', validarFechas_1.validarFechas, (0, asyncHandler_1.asyncHandler)(reportesController_1.getReporteVentas));
router.get('/produccion', validarFechas_1.validarFechas, (0, asyncHandler_1.asyncHandler)(reportesController_1.getReporteProduccion));
router.get('/materias-primas', validarFechas_1.validarFechas, (0, asyncHandler_1.asyncHandler)(reportesController_1.getReporteConsumoMateriasPrimas));
// Ruta para reporte de inventario (no requiere fechas)
router.get('/inventario', (0, asyncHandler_1.asyncHandler)(reportesController_1.getReporteInventario));
exports.default = router;
//# sourceMappingURL=reportesRoutes.js.map