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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProduccionesPorFecha = exports.getProduccionById = exports.getAllProducciones = void 0;
const init_db_1 = require("../config/init-db");
const database_1 = require("../config/database"); // Importar Op directamente
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
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            order: [['fecha_hora', 'DESC']]
        });
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
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            order: [['fecha_hora', 'ASC']]
        });
        // Agrupar por receta
        const produccionesPorReceta = producciones.reduce((acc, prod) => {
            const recetaId = prod.RecetaId; // Acceder directamente si es una propiedad
            if (!acc[recetaId]) {
                acc[recetaId] = {
                    receta: {
                        id: recetaId,
                        nombre: prod.Receta.nombre,
                        descripcion: prod.Receta.descripcion
                    },
                    totalProducido: 0,
                    producciones: []
                };
            }
            acc[recetaId].totalProducido += prod.cantidad; // Acceder directamente si es una propiedad
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
