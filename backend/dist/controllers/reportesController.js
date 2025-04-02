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
exports.getReporteConsumoMateriasPrimas = exports.getReporteProduccion = exports.getReporteInventario = exports.getReporteVentas = exports.validarFechas = void 0;
const init_db_1 = require("../config/init-db");
const sequelize_1 = require("sequelize");
// Middleware para validar y procesar fechas
const validarFechas = (req, res, next) => {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Debe proporcionar fechas de inicio y fin' });
    }
    try {
        // Crear objetos Date con las fechas proporcionadas
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        // Añadir las fechas procesadas al request
        req.fechaInicio = inicio;
        req.fechaFin = fin;
        next();
    }
    catch (error) {
        return res.status(400).json({ message: 'Formato de fecha inválido' });
    }
};
exports.validarFechas = validarFechas;
// Función auxiliar para formatear fechas
const formatearFecha = (fecha) => {
    return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
};
// Reporte de ventas por período
const getReporteVentas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inicio = req.fechaInicio;
        const fin = req.fechaFin;
        // Obtener todas las ventas en el período
        const ventas = yield init_db_1.models.Venta.findAll({
            where: {
                fecha_hora: {
                    [sequelize_1.Op.between]: [inicio, fin]
                },
                anulada: false // Solo ventas no anuladas
            },
            include: [
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
            order: [['fecha_hora', 'ASC']]
        });
        // Calcular totales y agrupar por día
        const ventasPorDia = {};
        let totalVentas = 0;
        let totalProductos = 0;
        ventas.forEach((venta) => {
            const fecha = new Date(venta.get('fecha_hora'));
            const diaKey = formatearFecha(fecha);
            if (!ventasPorDia[diaKey]) {
                ventasPorDia[diaKey] = {
                    fecha: diaKey,
                    totalDia: 0,
                    cantidadVentas: 0,
                    productos: []
                };
            }
            const detalles = venta.get('DetalleVentas');
            if (!detalles || !Array.isArray(detalles)) {
                return; // Skip if detalles is not available or not an array
            }
            let subtotal = 0;
            detalles.forEach(detalle => {
                subtotal += detalle.subtotal;
                totalProductos += detalle.cantidad;
                // Agregar o actualizar producto en el registro diario
                const productoIndex = ventasPorDia[diaKey].productos.findIndex((p) => p.id === detalle.RecetaId);
                if (productoIndex >= 0) {
                    ventasPorDia[diaKey].productos[productoIndex].cantidad += detalle.cantidad;
                    ventasPorDia[diaKey].productos[productoIndex].total += detalle.subtotal;
                }
                else {
                    ventasPorDia[diaKey].productos.push({
                        id: detalle.RecetaId,
                        nombre: detalle.Receta.nombre,
                        cantidad: detalle.cantidad,
                        total: detalle.subtotal
                    });
                }
            });
            ventasPorDia[diaKey].totalDia += subtotal;
            ventasPorDia[diaKey].cantidadVentas++;
            totalVentas += subtotal;
        });
        // Ordenar productos por cantidad vendida para cada día
        Object.values(ventasPorDia).forEach((dia) => {
            dia.productos.sort((a, b) => b.cantidad - a.cantidad);
        });
        // Crear resumen por producto
        const productosTotales = {};
        Object.values(ventasPorDia).forEach((dia) => {
            dia.productos.forEach((prod) => {
                if (!productosTotales[prod.id]) {
                    productosTotales[prod.id] = {
                        id: prod.id,
                        nombre: prod.nombre,
                        cantidad: 0,
                        total: 0
                    };
                }
                productosTotales[prod.id].cantidad += prod.cantidad;
                productosTotales[prod.id].total += prod.total;
            });
        });
        // Convertir a array y ordenar por cantidad
        const resumenProductos = Object.values(productosTotales).sort((a, b) => b.cantidad - a.cantidad);
        return res.status(200).json({
            fechaInicio: formatearFecha(inicio),
            fechaFin: formatearFecha(fin),
            totalVentas,
            totalProductos,
            cantidadVentas: ventas.length,
            ventasPorDia: Object.values(ventasPorDia),
            resumenProductos
        });
    }
    catch (error) {
        console.error('Error al generar reporte de ventas:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return res.status(500).json({
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? message : undefined
        });
    }
});
exports.getReporteVentas = getReporteVentas;
// Reporte de inventario y alertas
const getReporteInventario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener todas las materias primas
        const materiasPrimas = yield init_db_1.models.MateriaPrima.findAll({
            order: [['nombre', 'ASC']]
        });
        // Separar en materias primas normales y con alertas
        const materiasPrimasNormales = [];
        const materiasConAlerta = [];
        materiasPrimas.forEach((item) => {
            const itemObj = item.toJSON();
            // Verificar si está por debajo del umbral mínimo
            if (itemObj.cantidad_stock <= itemObj.umbral_minimo) {
                itemObj.porcentajeStock = Math.round((itemObj.cantidad_stock / itemObj.umbral_minimo) * 100);
                materiasConAlerta.push(itemObj);
            }
            else {
                itemObj.porcentajeStock = Math.round((itemObj.cantidad_stock / itemObj.umbral_minimo) * 100);
                materiasPrimasNormales.push(itemObj);
            }
        });
        // Ordenar alertas por porcentaje de stock (ascendente)
        materiasConAlerta.sort((a, b) => a.porcentajeStock - b.porcentajeStock);
        return res.status(200).json({
            totalItems: materiasPrimas.length,
            itemsConAlerta: materiasConAlerta.length,
            alertas: materiasConAlerta,
            inventarioNormal: materiasPrimasNormales
        });
    }
    catch (error) {
        console.error('Error al generar reporte de inventario:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return res.status(500).json({
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? message : undefined
        });
    }
});
exports.getReporteInventario = getReporteInventario;
// Reporte de producción por período
const getReporteProduccion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inicio = req.fechaInicio;
        const fin = req.fechaFin;
        // Obtener todas las producciones en el período
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [sequelize_1.Op.between]: [inicio, fin]
                }
            },
            include: [
                {
                    model: init_db_1.models.Usuario,
                    attributes: ['id', 'nombre', 'apellido']
                },
                {
                    model: init_db_1.models.Receta,
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ],
            order: [['fecha_hora', 'ASC']]
        });
        // Agrupar por día y por receta
        const produccionPorDia = {};
        const recetasTotales = {};
        let totalProducido = 0;
        producciones.forEach((prod) => {
            const fecha = new Date(prod.get('fecha_hora'));
            const diaKey = formatearFecha(fecha);
            const recetaId = prod.get('RecetaId');
            const cantidad = prod.get('cantidad');
            const receta = prod.get('Receta');
            const usuario = prod.get('Usuario');
            if (!receta)
                return; // Skip if receta is not available
            // Agregar al total global
            totalProducido += cantidad;
            // Agregar a totales por receta
            if (!recetasTotales[recetaId]) {
                recetasTotales[recetaId] = {
                    id: recetaId,
                    nombre: receta.nombre,
                    descripcion: receta.descripcion,
                    cantidad: 0
                };
            }
            recetasTotales[recetaId].cantidad += cantidad;
            // Agregar al registro diario
            if (!produccionPorDia[diaKey]) {
                produccionPorDia[diaKey] = {
                    fecha: diaKey,
                    totalDia: 0,
                    recetas: {}
                };
            }
            if (!produccionPorDia[diaKey].recetas[recetaId]) {
                produccionPorDia[diaKey].recetas[recetaId] = {
                    id: recetaId,
                    nombre: receta.nombre,
                    cantidad: 0,
                    usuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'N/A'
                };
            }
            produccionPorDia[diaKey].recetas[recetaId].cantidad += cantidad;
            produccionPorDia[diaKey].totalDia += cantidad;
        });
        // Convertir recetas por día de objeto a array
        Object.keys(produccionPorDia).forEach(dia => {
            produccionPorDia[dia].recetas = Object.values(produccionPorDia[dia].recetas);
            // Ordenar recetas por cantidad (mayor a menor)
            produccionPorDia[dia].recetas.sort((a, b) => b.cantidad - a.cantidad);
        });
        // Convertir recetas totales de objeto a array ordenado por cantidad
        const resumenRecetas = Object.values(recetasTotales).sort((a, b) => b.cantidad - a.cantidad);
        return res.status(200).json({
            fechaInicio: formatearFecha(inicio),
            fechaFin: formatearFecha(fin),
            totalProducido,
            cantidadProducciones: producciones.length,
            produccionPorDia: Object.values(produccionPorDia),
            resumenRecetas
        });
    }
    catch (error) {
        console.error('Error al generar reporte de producción:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return res.status(500).json({
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? message : undefined
        });
    }
});
exports.getReporteProduccion = getReporteProduccion;
// Reporte de consumo de materias primas por período
const getReporteConsumoMateriasPrimas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inicio = req.fechaInicio;
        const fin = req.fechaFin;
        // Obtener todas las producciones en el período con sus recetas y materias primas
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [sequelize_1.Op.between]: [inicio, fin]
                }
            },
            include: [
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
            ],
            order: [['fecha_hora', 'ASC']]
        });
        // Calcular consumo total de materias primas
        const materiasPrimasConsumidas = {};
        let totalMateriasPrimas = 0;
        producciones.forEach((prod) => {
            const cantidad = prod.get('cantidad');
            const receta = prod.get('Receta');
            if (!receta || !receta.MateriaPrimas || !Array.isArray(receta.MateriaPrimas)) {
                return; // Skip if materias primas data is not available
            }
            receta.MateriaPrimas.forEach((mp) => {
                const mpId = mp.id;
                const mpReceta = mp.RecetaMateriaPrima;
                if (!mpReceta)
                    return; // Skip if relation data is not available
                const cantidadPorUnidad = mpReceta.cantidad;
                const unidadMedida = mpReceta.unidad_medida;
                const consumoTotal = cantidadPorUnidad * cantidad;
                if (!materiasPrimasConsumidas[mpId]) {
                    materiasPrimasConsumidas[mpId] = {
                        id: mpId,
                        nombre: mp.nombre,
                        unidad_medida: unidadMedida,
                        cantidad: 0
                    };
                }
                materiasPrimasConsumidas[mpId].cantidad += consumoTotal;
                totalMateriasPrimas += consumoTotal;
            });
        });
        // Convertir a array y ordenar por cantidad consumida
        const resumenMateriasPrimas = Object.values(materiasPrimasConsumidas).sort((a, b) => b.cantidad - a.cantidad);
        return res.status(200).json({
            fechaInicio: formatearFecha(inicio),
            fechaFin: formatearFecha(fin),
            totalMateriasPrimas,
            materiasPrimasConsumidas: resumenMateriasPrimas
        });
    }
    catch (error) {
        console.error('Error al generar reporte de consumo de materias primas:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return res.status(500).json({
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? message : undefined
        });
    }
});
exports.getReporteConsumoMateriasPrimas = getReporteConsumoMateriasPrimas;
