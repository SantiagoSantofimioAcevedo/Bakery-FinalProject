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
exports.anularVenta = exports.createVenta = exports.getVentaById = exports.getAllVentas = void 0;
const init_db_1 = require("../config/init-db");
const database_1 = __importDefault(require("../config/database"));
// Obtener todas las ventas
const getAllVentas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ventas = yield init_db_1.models.Venta.findAll({
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.DetalleVenta,
                    include: [
                        {
                            model: init_db_1.models.Receta,
                            attributes: ['id', 'nombre', 'precio_venta']
                        }
                    ]
                }
            ],
            order: [['fecha_hora', 'DESC']]
        });
        const ventasConTotal = ventas.map(venta => {
            const ventaObj = venta.toJSON();
            ventaObj.total = ventaObj.DetalleVentas && ventaObj.DetalleVentas.length > 0
                ? ventaObj.DetalleVentas.reduce((sum, detalle) => sum + detalle.subtotal, 0)
                : 0;
            return ventaObj;
        });
        return res.status(200).json(ventasConTotal);
    }
    catch (error) {
        console.error('Error al obtener ventas:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getAllVentas = getAllVentas;
// Obtener una venta por ID
const getVentaById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const venta = yield init_db_1.models.Venta.findByPk(id, {
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.DetalleVenta,
                    include: [
                        {
                            model: init_db_1.models.Receta,
                            attributes: ['id', 'nombre', 'precio_venta']
                        }
                    ]
                }
            ]
        });
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        // Calcular el total de la venta
        const ventaObj = venta.toJSON();
        // Verificar si DetalleVentas existe antes de usar reduce
        ventaObj.total = ventaObj.DetalleVentas && ventaObj.DetalleVentas.length > 0
            ? ventaObj.DetalleVentas.reduce((sum, detalle) => sum + detalle.subtotal, 0)
            : 0; // Si no hay detalles, el total es 0
        return res.status(200).json(ventaObj);
    }
    catch (error) {
        console.error('Error al obtener venta:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getVentaById = getVentaById;
// Crear una nueva venta
const createVenta = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const t = yield database_1.default.transaction();
    try {
        const { detalles } = req.body;
        const usuarioId = req.user.id; // Obtenido del middleware de autenticación
        // Validar que hay detalles de venta
        if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
            yield t.rollback();
            return res.status(400).json({ message: 'Debe incluir al menos un producto en la venta' });
        }
        // Crear la venta
        const nuevaVenta = yield init_db_1.models.Venta.create({
            UsuarioId: usuarioId,
            fecha_hora: new Date()
        }, { transaction: t });
        // Crear los detalles de venta
        let totalVenta = 0;
        for (const detalle of detalles) {
            const { recetaId, cantidad } = detalle;
            // Verificar que la receta existe
            const receta = yield init_db_1.models.Receta.findByPk(recetaId);
            if (!receta) {
                yield t.rollback();
                return res.status(404).json({ message: `Receta con ID ${recetaId} no encontrada` });
            }
            const precio = receta.get('precio_venta');
            const subtotal = precio * cantidad;
            totalVenta += subtotal;
            // Crear el detalle de venta
            yield init_db_1.models.DetalleVenta.create({
                VentaId: nuevaVenta.get('id'),
                RecetaId: recetaId,
                cantidad,
                precio_unitario: precio,
                subtotal
            }, { transaction: t });
        }
        // Confirmar la transacción
        yield t.commit();
        // Obtener la venta completa con los detalles
        const ventaId = nuevaVenta.get('id');
        const ventaCompleta = yield init_db_1.models.Venta.findByPk(ventaId, {
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.DetalleVenta,
                    include: [
                        {
                            model: init_db_1.models.Receta,
                            attributes: ['id', 'nombre', 'precio_venta']
                        }
                    ]
                }
            ]
        });
        if (!ventaCompleta) {
            // Esto no debería ocurrir ya que acabamos de crear la venta
            yield t.rollback();
            return res.status(500).json({ message: 'Error: No se pudo recuperar la venta creada' });
        }
        // Calcular el total de la venta
        const ventaObj = ventaCompleta.toJSON();
        ventaObj.total = totalVenta;
        return res.status(201).json(ventaObj);
    }
    catch (error) {
        yield t.rollback();
        console.error('Error al crear venta:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.createVenta = createVenta;
// Anular una venta
const anularVenta = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const t = yield database_1.default.transaction();
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const usuarioId = req.user.id; // Obtenido del middleware de autenticación
        // Verificar que se proporciona un motivo
        if (!motivo) {
            yield t.rollback();
            return res.status(400).json({ message: 'Debe proporcionar un motivo para anular la venta' });
        }
        // Buscar la venta
        const venta = yield init_db_1.models.Venta.findByPk(id, {
            include: [
                {
                    model: init_db_1.models.DetalleVenta
                }
            ]
        });
        if (!venta) {
            yield t.rollback();
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        // Verificar que la venta no esté ya anulada
        if (venta.get('anulada')) {
            yield t.rollback();
            return res.status(400).json({ message: 'Esta venta ya fue anulada' });
        }
        // Marcar la venta como anulada
        yield venta.update({
            anulada: true,
            motivo_anulacion: motivo,
            usuario_anulacion_id: usuarioId,
            fecha_anulacion: new Date()
        }, { transaction: t });
        // Confirmar la transacción
        yield t.commit();
        return res.status(200).json({
            message: 'Venta anulada correctamente',
            venta: venta.toJSON()
        });
    }
    catch (error) {
        yield t.rollback();
        console.error('Error al anular venta:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.anularVenta = anularVenta;
