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
exports.getLowStock = exports.adjustStock = exports.deleteMateriaPrima = exports.updateMateriaPrima = exports.createMateriaPrima = exports.getMateriaPrimaById = exports.getAllMateriasPrimas = void 0;
const init_db_1 = require("../config/init-db");
// Obtener todas las materias primas
const getAllMateriasPrimas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const materiasPrimas = yield init_db_1.models.MateriaPrima.findAll();
        return res.status(200).json(materiasPrimas);
    }
    catch (error) {
        console.error('Error al obtener materias primas:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getAllMateriasPrimas = getAllMateriasPrimas;
// Obtener una materia prima por ID
const getMateriaPrimaById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const materiaPrima = yield init_db_1.models.MateriaPrima.findByPk(id);
        if (!materiaPrima) {
            return res.status(404).json({ message: 'Materia prima no encontrada' });
        }
        return res.status(200).json(materiaPrima);
    }
    catch (error) {
        console.error('Error al obtener materia prima:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getMateriaPrimaById = getMateriaPrimaById;
// Crear una nueva materia prima
const createMateriaPrima = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre, unidad_medida, cantidad_stock, costo_unitario, umbral_minimo } = req.body;
        // Validar que se enviaron todos los campos requeridos
        if (!nombre || !unidad_medida || costo_unitario === undefined || umbral_minimo === undefined) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }
        // Validar que los valores numéricos sean positivos
        if (cantidad_stock < 0 || costo_unitario < 0 || umbral_minimo < 0) {
            return res.status(400).json({ message: 'Los valores numéricos deben ser positivos' });
        }
        // Crear la nueva materia prima
        const nuevaMateriaPrima = yield init_db_1.models.MateriaPrima.create({
            nombre,
            unidad_medida,
            cantidad_stock: cantidad_stock || 0,
            costo_unitario,
            umbral_minimo,
            fecha_ultima_actualizacion: new Date()
        });
        return res.status(201).json(nuevaMateriaPrima);
    }
    catch (error) {
        console.error('Error al crear materia prima:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.createMateriaPrima = createMateriaPrima;
// Actualizar una materia prima existente
const updateMateriaPrima = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { nombre, unidad_medida, cantidad_stock, costo_unitario, umbral_minimo } = req.body;
        // Buscar la materia prima
        const materiaPrima = yield init_db_1.models.MateriaPrima.findByPk(id);
        if (!materiaPrima) {
            return res.status(404).json({ message: 'Materia prima no encontrada' });
        }
        // Validar que los valores numéricos sean positivos si están definidos
        if ((cantidad_stock !== undefined && cantidad_stock < 0) ||
            (costo_unitario !== undefined && costo_unitario < 0) ||
            (umbral_minimo !== undefined && umbral_minimo < 0)) {
            return res.status(400).json({ message: 'Los valores numéricos deben ser positivos' });
        }
        // Actualizar la materia prima
        yield materiaPrima.update({
            nombre: nombre || materiaPrima.get('nombre'),
            unidad_medida: unidad_medida || materiaPrima.get('unidad_medida'),
            cantidad_stock: cantidad_stock !== undefined ? cantidad_stock : materiaPrima.get('cantidad_stock'),
            costo_unitario: costo_unitario !== undefined ? costo_unitario : materiaPrima.get('costo_unitario'),
            umbral_minimo: umbral_minimo !== undefined ? umbral_minimo : materiaPrima.get('umbral_minimo'),
            fecha_ultima_actualizacion: new Date()
        });
        return res.status(200).json(materiaPrima);
    }
    catch (error) {
        console.error('Error al actualizar materia prima:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.updateMateriaPrima = updateMateriaPrima;
// Eliminar una materia prima
const deleteMateriaPrima = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Buscar la materia prima
        const materiaPrima = yield init_db_1.models.MateriaPrima.findByPk(id);
        if (!materiaPrima) {
            return res.status(404).json({ message: 'Materia prima no encontrada' });
        }
        // Verificar si la materia prima está siendo utilizada en alguna receta
        const recetaIngredientes = yield init_db_1.models.RecetaIngrediente.findOne({
            where: { MateriaPrimaId: id }
        });
        if (recetaIngredientes) {
            return res.status(400).json({
                message: 'No se puede eliminar esta materia prima porque está siendo utilizada en una o más recetas'
            });
        }
        // Eliminar la materia prima
        yield materiaPrima.destroy();
        return res.status(200).json({ message: 'Materia prima eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar materia prima:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.deleteMateriaPrima = deleteMateriaPrima;
// Ajustar el stock de una materia prima
const adjustStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { cantidad, motivo } = req.body;
        // Validar que se enviaron todos los campos requeridos
        if (cantidad === undefined || !motivo) {
            return res.status(400).json({ message: 'Cantidad y motivo son requeridos' });
        }
        // Buscar la materia prima
        const materiaPrima = yield init_db_1.models.MateriaPrima.findByPk(id);
        if (!materiaPrima) {
            return res.status(404).json({ message: 'Materia prima no encontrada' });
        }
        // Calcular nuevo stock
        const stockActual = materiaPrima.get('cantidad_stock');
        const nuevoStock = stockActual + cantidad;
        // Validar que el nuevo stock no sea negativo
        if (nuevoStock < 0) {
            return res.status(400).json({ message: 'El stock no puede ser negativo' });
        }
        // Actualizar el stock
        yield materiaPrima.update({
            cantidad_stock: nuevoStock,
            fecha_ultima_actualizacion: new Date()
        });
        // Aquí podrías registrar el movimiento en una tabla de historial si lo deseas
        return res.status(200).json({
            message: 'Stock ajustado correctamente',
            materiaPrima
        });
    }
    catch (error) {
        console.error('Error al ajustar stock:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.adjustStock = adjustStock;
// Obtener materias primas con stock bajo
const getLowStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener todas las materias primas
        const materiasPrimas = yield init_db_1.models.MateriaPrima.findAll();
        // Filtrar las que tienen stock bajo
        const lowStock = materiasPrimas.filter(item => {
            const stock = item.get('cantidad_stock');
            const umbral = item.get('umbral_minimo');
            return stock <= umbral;
        });
        return res.status(200).json(lowStock);
    }
    catch (error) {
        console.error('Error al obtener materias primas con stock bajo:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getLowStock = getLowStock;
