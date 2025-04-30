"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProduccionesPorRango = exports.getProduccionesSemanales = exports.getProduccionesDiarias = exports.createProduccion = exports.getProduccionesPorFecha = exports.getProduccionById = exports.getAllProducciones = void 0;
const init_db_1 = require("../config/init-db");
const database_1 = __importStar(require("../config/database")); // Importar Op directamente
const unitConversion_1 = require("../utils/unitConversion");
// Obtener todas las producciones
const getAllProducciones = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const producciones = yield init_db_1.models.Produccion.findAll({
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            order: [['fecha_hora', 'DESC']]
        });
        console.log('Producciones obtenidas:', JSON.stringify(producciones, null, 2));
        return res.status(200).json(producciones);
    }
    catch (error) {
        console.error('Error al obtener producciones:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getAllProducciones = getAllProducciones;
// Obtener una producción por ID
const getProduccionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const produccion = yield init_db_1.models.Produccion.findByPk(id, {
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    include: [
                        {
                            model: init_db_1.models.MateriaPrima,
                            through: {
                                attributes: ['cantidad', 'unidad_medida']
                            }
                        }
                    ]
                }
            ]
        });
        if (!produccion) {
            return res.status(404).json({ message: 'Producción no encontrada' });
        }
        return res.status(200).json(produccion);
    }
    catch (error) {
        console.error('Error al obtener producción:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getProduccionById = getProduccionById;
// Obtener producciones por fecha
const getProduccionesPorFecha = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha } = req.params;
        // Crear objeto Date con la fecha proporcionada
        const fechaInicio = new Date(fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(fecha);
        fechaFin.setHours(23, 59, 59, 999);
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [database_1.Op.between]: [fechaInicio, fechaFin] // Usar Op importado en lugar de sequelize.Op
                }
            },
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            order: [['fecha_hora', 'ASC']]
        });
        // Agrupar por receta
        const produccionesPorReceta = producciones.reduce((acc, prod) => {
            const recetaId = prod.RecetaId;
            if (!acc[recetaId]) {
                acc[recetaId] = {
                    receta: {
                        id: recetaId,
                        nombre: prod.Recetum.nombre,
                        descripcion: prod.Recetum.descripcion
                    },
                    totalProducido: 0,
                    producciones: []
                };
            }
            acc[recetaId].totalProducido += prod.cantidad;
            acc[recetaId].producciones.push(prod);
            return acc;
        }, {});
        return res.status(200).json(Object.values(produccionesPorReceta));
    }
    catch (error) {
        console.error('Error al obtener producciones por fecha:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getProduccionesPorFecha = getProduccionesPorFecha;
// Crear una nueva producción
const createProduccion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const t = yield database_1.default.transaction();
    try {
        const { recetaId, cantidad } = req.body;
        if (!req.usuario) {
            yield t.rollback();
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const usuarioId = req.usuario.id;
        console.log('Datos recibidos:', { recetaId, cantidad, usuarioId });
        // Validar datos requeridos
        if (!recetaId || !cantidad || cantidad <= 0) {
            yield t.rollback();
            return res.status(400).json({ message: 'Datos inválidos para la producción' });
        }
        // Buscar la receta con sus ingredientes
        const receta = yield init_db_1.models.Receta.findByPk(recetaId, {
            include: [
                {
                    model: init_db_1.models.MateriaPrima,
                    through: {
                        attributes: ['cantidad', 'unidad_medida']
                    }
                }
            ]
        });
        if (!receta) {
            yield t.rollback();
            return res.status(404).json({ message: 'Receta no encontrada' });
        }
        // Verificar si hay suficientes ingredientes
        const ingredientes = receta.get('MateriaPrimas');
        const ingredientesFaltantes = [];
        for (const ingrediente of ingredientes) {
            const cantidadNecesariaEnReceta = ingrediente.RecetaIngrediente.cantidad * cantidad;
            const unidadEnReceta = ingrediente.RecetaIngrediente.unidad_medida;
            const unidadEnStock = ingrediente.unidad_medida;
            const cantidadDisponibleEnStock = ingrediente.cantidad_stock;
            // Convertir la cantidad necesaria a la unidad del stock
            let cantidadNecesariaConvertida = cantidadNecesariaEnReceta;
            if (unidadEnReceta !== unidadEnStock) {
                const cantidadConvertida = (0, unitConversion_1.convertirUnidades)(cantidadNecesariaEnReceta, unidadEnReceta, unidadEnStock);
                if (cantidadConvertida !== null) {
                    cantidadNecesariaConvertida = cantidadConvertida;
                }
                else {
                    console.warn(`No se pudo convertir de ${unidadEnReceta} a ${unidadEnStock} para ${ingrediente.nombre}`);
                    // Si no se puede convertir, asumimos que no hay suficiente inventario por seguridad
                    ingredientesFaltantes.push({
                        nombre: ingrediente.nombre,
                        cantidadNecesaria: cantidadNecesariaEnReceta,
                        cantidadDisponible: cantidadDisponibleEnStock,
                        unidadReceta: unidadEnReceta,
                        unidadStock: unidadEnStock,
                        mensaje: `No se pudo convertir de ${unidadEnReceta} a ${unidadEnStock}`
                    });
                    continue;
                }
            }
            if (cantidadDisponibleEnStock < cantidadNecesariaConvertida) {
                ingredientesFaltantes.push({
                    nombre: ingrediente.nombre,
                    cantidadNecesaria: cantidadNecesariaEnReceta,
                    cantidadDisponible: cantidadDisponibleEnStock,
                    unidadReceta: unidadEnReceta,
                    unidadStock: unidadEnStock,
                    cantidadConvertida: cantidadNecesariaConvertida
                });
            }
        }
        if (ingredientesFaltantes.length > 0) {
            yield t.rollback();
            return res.status(400).json({
                message: 'No hay suficientes ingredientes para esta producción',
                ingredientesFaltantes
            });
        }
        // Descontar ingredientes del inventario
        for (const ingrediente of ingredientes) {
            const cantidadNecesariaEnReceta = ingrediente.RecetaIngrediente.cantidad * cantidad;
            const unidadEnReceta = ingrediente.RecetaIngrediente.unidad_medida;
            const unidadEnStock = ingrediente.unidad_medida;
            // Convertir la cantidad necesaria a la unidad del stock
            let cantidadADescontar = cantidadNecesariaEnReceta;
            if (unidadEnReceta !== unidadEnStock) {
                const cantidadConvertida = (0, unitConversion_1.convertirUnidades)(cantidadNecesariaEnReceta, unidadEnReceta, unidadEnStock);
                if (cantidadConvertida !== null) {
                    cantidadADescontar = cantidadConvertida;
                }
                else {
                    // Ya hemos verificado arriba que todas las conversiones son posibles
                    console.error(`Error inesperado: No se pudo convertir de ${unidadEnReceta} a ${unidadEnStock}`);
                    yield t.rollback();
                    return res.status(500).json({ message: 'Error en la conversión de unidades' });
                }
            }
            const nuevoStock = ingrediente.cantidad_stock - cantidadADescontar;
            yield init_db_1.models.MateriaPrima.update({
                cantidad_stock: nuevoStock,
                fecha_ultima_actualizacion: new Date()
            }, {
                where: { id: ingrediente.id },
                transaction: t
            });
            // Registrar el movimiento de inventario
            yield init_db_1.models.MovimientoInventario.create({
                MateriaPrimaId: ingrediente.id,
                UsuarioId: usuarioId,
                tipo: 'SALIDA',
                cantidad: cantidadADescontar,
                unidad_medida: unidadEnStock,
                motivo: `Producción de ${cantidad} unidades de ${receta.get('nombre')}`,
                fecha: new Date()
            }, { transaction: t });
        }
        // Crear el registro de producción
        const produccion = yield init_db_1.models.Produccion.create({
            RecetaId: recetaId,
            UsuarioId: usuarioId,
            cantidad,
            fecha_hora: new Date()
        }, { transaction: t });
        console.log('Producción creada:', produccion.toJSON());
        // Obtener la producción con sus relaciones
        const produccionCompleta = yield init_db_1.models.Produccion.findByPk(produccion.getDataValue('id'), {
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'usuario']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            transaction: t
        });
        console.log('Producción completa:', JSON.stringify(produccionCompleta, null, 2));
        yield t.commit();
        return res.status(201).json(produccionCompleta);
    }
    catch (error) {
        yield t.rollback();
        console.error('Error al crear producción:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.createProduccion = createProduccion;
// Obtener producciones del día actual
const getProduccionesDiarias = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [database_1.Op.gte]: today,
                    [database_1.Op.lt]: tomorrow
                }
            },
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['nombre', 'apellido']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    attributes: ['nombre']
                }
            ],
            order: [['fecha_hora', 'DESC']]
        });
        const produccionesConDetalles = producciones.map(produccion => {
            const produccionJSON = produccion.toJSON();
            return {
                id: produccionJSON.id,
                fecha_hora: produccionJSON.fecha_hora,
                cantidad: produccionJSON.cantidad,
                Usuario: produccionJSON.Usuario,
                Receta: {
                    nombre: produccionJSON.Recetum.nombre
                }
            };
        });
        res.json(produccionesConDetalles);
    }
    catch (error) {
        console.error('Error al obtener producciones diarias:', error);
        res.status(500).json({
            message: 'Error al obtener las producciones diarias',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.getProduccionesDiarias = getProduccionesDiarias;
// Obtener producciones de la semana actual
const getProduccionesSemanales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        // Obtener el inicio de la semana (domingo actual)
        const startOfWeek = new Date(today);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Retroceder al domingo actual
        // Obtener el fin de la semana (próximo domingo)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // 7 días después = próximo domingo
        endOfWeek.setHours(23, 59, 59, 999);
        console.log('Rango de fechas para semana actual:', {
            startOfWeek: startOfWeek.toISOString(),
            endOfWeek: endOfWeek.toISOString(),
            today: today.toISOString()
        });
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [database_1.Op.gte]: startOfWeek,
                    [database_1.Op.lt]: endOfWeek
                }
            },
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['nombre', 'apellido']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    attributes: ['nombre']
                }
            ],
            order: [['fecha_hora', 'ASC']]
        });
        const produccionesConDetalles = producciones.map(produccion => {
            const produccionJSON = produccion.toJSON();
            const fechaLocal = new Date(produccionJSON.fecha_hora);
            return {
                id: produccionJSON.id,
                fecha_hora: fechaLocal.toISOString(),
                cantidad: produccionJSON.cantidad,
                Usuario: produccionJSON.Usuario,
                Receta: {
                    nombre: produccionJSON.Recetum.nombre
                }
            };
        });
        console.log(`Se encontraron ${produccionesConDetalles.length} producciones para la semana actual`);
        res.json(produccionesConDetalles);
    }
    catch (error) {
        console.error('Error al obtener producciones semanales:', error);
        res.status(500).json({
            message: 'Error al obtener las producciones semanales',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.getProduccionesSemanales = getProduccionesSemanales;
// Nuevo endpoint para obtener producciones por rango de fechas
const getProduccionesPorRango = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            res.status(400).json({ message: 'Se requieren fechaInicio y fechaFin' });
            return;
        }
        const startDate = new Date(fechaInicio);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(fechaFin);
        endDate.setHours(23, 59, 59, 999);
        console.log('Consultando producciones por rango:', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [database_1.Op.gte]: startDate,
                    [database_1.Op.lt]: endDate
                }
            },
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['nombre', 'apellido']
                },
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    attributes: ['nombre']
                }
            ],
            order: [['fecha_hora', 'ASC']]
        });
        const produccionesConDetalles = producciones.map(produccion => {
            const produccionJSON = produccion.toJSON();
            const fechaLocal = new Date(produccionJSON.fecha_hora);
            return {
                id: produccionJSON.id,
                fecha_hora: fechaLocal.toISOString(),
                cantidad: produccionJSON.cantidad,
                Usuario: produccionJSON.Usuario,
                Receta: {
                    nombre: produccionJSON.Recetum.nombre
                }
            };
        });
        res.json(produccionesConDetalles);
    }
    catch (error) {
        console.error('Error al obtener producciones por rango:', error);
        res.status(500).json({
            message: 'Error al obtener las producciones por rango',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.getProduccionesPorRango = getProduccionesPorRango;
//# sourceMappingURL=produccionController.js.map