"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const init_db_1 = require("../config/init-db");
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
// Función para formatear valores a pesos colombianos
const formatCOP = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const getDashboardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Obtener alertas de inventario
        const inventoryAlerts = yield init_db_1.models.MateriaPrima.findAll({
            where: {
                cantidad_stock: {
                    [sequelize_1.Op.lte]: database_1.default.col('umbral_minimo')
                }
            }
        });
        // Obtener productos más vendidos
        const topSellingProducts = yield init_db_1.models.DetalleVenta.findAll({
            attributes: [
                'RecetumId',
                [database_1.default.fn('SUM', database_1.default.col('cantidad')), 'cantidad']
            ],
            include: [{
                    model: init_db_1.models.Receta,
                    attributes: ['nombre', 'id'],
                    as: 'Recetum',
                    required: false // Make this a LEFT JOIN to show all sales even without recipe
                }],
            group: ['RecetumId', 'Recetum.id', 'Recetum.nombre'],
            order: [[database_1.default.fn('SUM', database_1.default.col('cantidad')), 'DESC']],
            limit: 5
        });
        // Log for debugging
        console.log('Top selling products raw data:', JSON.stringify(topSellingProducts.map(p => {
            var _a;
            return ({
                recetaId: p.get('RecetumId'),
                recetaNombre: (_a = p.Recetum) === null || _a === void 0 ? void 0 : _a.nombre,
                cantidad: p.get('cantidad')
            });
        }), null, 2));
        // Obtener resumen de ventas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const salesSummary = yield init_db_1.models.Venta.findAll({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('total')), 'total']
            ],
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: today
                }
            }
        });
        const weeklySales = yield init_db_1.models.Venta.findAll({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('total')), 'total']
            ],
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: weekStart
                }
            }
        });
        const monthlySales = yield init_db_1.models.Venta.findAll({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('total')), 'total']
            ],
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: monthStart
                }
            }
        });
        // Obtener producción de hoy
        const productionToday = yield init_db_1.models.Produccion.count({
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: today
                }
            }
        });
        // For the "Sin nombre" product, try to find if it has a name in the Receta table
        const sinNombreProducts = topSellingProducts.filter(product => { var _a; return !((_a = product.Recetum) === null || _a === void 0 ? void 0 : _a.nombre); });
        if (sinNombreProducts.length > 0) {
            console.log('Found products without names:', sinNombreProducts.map(p => `RecetumId: ${p.get('RecetumId')}, Cantidad: ${p.get('cantidad')}`));
        }
        // Obtener valores de ventas como números
        const todaySales = Number((_a = salesSummary[0]) === null || _a === void 0 ? void 0 : _a.get('total')) || 0;
        const weekSales = Number((_b = weeklySales[0]) === null || _b === void 0 ? void 0 : _b.get('total')) || 0;
        const monthSales = Number((_c = monthlySales[0]) === null || _c === void 0 ? void 0 : _c.get('total')) || 0;
        return res.status(200).json({
            inventoryAlerts,
            topSellingProducts: topSellingProducts.map(product => {
                var _a;
                const recetumId = product.get('RecetumId');
                const nombre = ((_a = product.Recetum) === null || _a === void 0 ? void 0 : _a.nombre) || 'Sin nombre';
                console.log(`Mapping product: RecetumId=${recetumId}, nombre=${nombre}`);
                return {
                    id: recetumId,
                    nombre,
                    cantidad: product.get('cantidad')
                };
            }),
            salesSummary: {
                today: todaySales,
                todayFormatted: formatCOP(todaySales),
                week: weekSales,
                weekFormatted: formatCOP(weekSales),
                month: monthSales,
                monthFormatted: formatCOP(monthSales)
            },
            productionToday
        });
    }
    catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({
            message: 'Error en el servidor',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.getDashboardData = getDashboardData;
//# sourceMappingURL=dashboardController.js.map