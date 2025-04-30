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
exports.getDashboardData = exports.getReporteConsumoMateriasPrimas = exports.getReporteProduccion = exports.getReporteInventario = exports.getReporteVentas = exports.validarFechas = void 0;
const init_db_1 = require("../config/init-db");
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
// Middleware para validar y procesar fechas
const validarFechas = (req, res, next) => {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
        const error = new Error('Debe proporcionar fechas de inicio y fin');
        return next(error);
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
        const err = new Error('Formato de fecha inválido');
        next(err);
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
        // Determinar las fechas según el timeframe solicitado
        const timeframe = req.query.timeframe || 'month';
        let inicio;
        let fin = new Date();
        // Calcular la fecha de inicio según el timeframe
        switch (timeframe) {
            case 'week':
                inicio = new Date();
                inicio.setDate(inicio.getDate() - 7);
                break;
            case 'quarter':
                inicio = new Date();
                inicio.setMonth(inicio.getMonth() - 3);
                break;
            case 'year':
                inicio = new Date();
                inicio.setFullYear(inicio.getFullYear() - 1);
                break;
            case 'month':
            default:
                inicio = new Date();
                inicio.setMonth(inicio.getMonth() - 1);
                break;
        }
        // Si se proporcionan fechas específicas, tienen prioridad sobre el timeframe
        if (req.query.fechaInicio) {
            inicio = new Date(req.query.fechaInicio);
        }
        if (req.query.fechaFin) {
            fin = new Date(req.query.fechaFin);
        }
        // Obtener todas las ventas en el período
        const ventas = yield init_db_1.models.Venta.findAll({
            where: {
                fecha_hora: {
                    [sequelize_1.Op.between]: [inicio, fin]
                }
            },
            include: [
                {
                    model: init_db_1.models.DetalleVenta,
                    as: 'DetalleVenta',
                    include: [
                        {
                            model: init_db_1.models.Receta,
                            as: 'Recetum',
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
            const detalles = venta.get('DetalleVenta');
            if (!detalles || !Array.isArray(detalles)) {
                return; // Skip if detalles is not available or not an array
            }
            let subtotal = 0;
            detalles.forEach(detalle => {
                subtotal += detalle.subtotal;
                totalProductos += detalle.cantidad;
                // Obtener el ID de la receta (puede estar como RecetaId o RecetumId)
                const recetaId = detalle.RecetaId || detalle.RecetumId;
                // Obtener el objeto receta (puede estar como Receta o Recetum)
                const receta = detalle.Receta || detalle.Recetum;
                if (!recetaId || !receta)
                    return; // Evitar error si no hay datos de receta
                // Agregar o actualizar producto en el registro diario
                const productoIndex = ventasPorDia[diaKey].productos.findIndex((p) => p.id === recetaId);
                if (productoIndex >= 0) {
                    ventasPorDia[diaKey].productos[productoIndex].cantidad += detalle.cantidad;
                    ventasPorDia[diaKey].productos[productoIndex].total += detalle.subtotal;
                }
                else {
                    ventasPorDia[diaKey].productos.push({
                        id: recetaId,
                        nombre: receta.nombre,
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
        console.log('📊 Generando reporte de inventario...');
        // Obtener todas las materias primas
        const materiasPrimas = yield init_db_1.models.MateriaPrima.findAll({
            order: [['nombre', 'ASC']]
        });
        // Separar materias primas en diferentes categorías
        const materiasAgotadas = [];
        const materiasBajas = [];
        const materiasNormales = [];
        materiasPrimas.forEach((item) => {
            const itemObj = item.toJSON();
            // Verificar si está agotada (stock es 0)
            if (itemObj.cantidad_stock === 0) {
                materiasAgotadas.push(itemObj);
            }
            // Verificar si está por debajo del umbral mínimo pero no agotada
            else if (itemObj.cantidad_stock <= itemObj.umbral_minimo) {
                materiasBajas.push(itemObj);
            }
            // Stock normal
            else {
                materiasNormales.push(itemObj);
            }
        });
        console.log(`📦 Inventario: ${materiasPrimas.length} materias primas totales`);
        console.log(`🔴 ${materiasAgotadas.length} materias primas agotadas`);
        console.log(`🟡 ${materiasBajas.length} materias primas con nivel bajo`);
        // Formatear respuesta para el frontend
        return res.status(200).json({
            materiasPrimas: materiasPrimas,
            materiasPrimasAgotadas: materiasAgotadas,
            materiasPrimasBajas: materiasBajas
        });
    }
    catch (error) {
        console.error('❌ Error al generar reporte de inventario:', error);
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
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    include: [
                        {
                            model: init_db_1.models.MateriaPrima,
                            as: 'MateriaPrimas',
                            through: {
                                attributes: ['cantidad', 'unidad_medida']
                            }
                        }
                    ]
                }
            ]
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
        // Determinar las fechas según el timeframe solicitado
        const timeframe = req.query.timeframe || 'month';
        let inicio;
        let fin = new Date();
        // Calcular la fecha de inicio según el timeframe
        switch (timeframe) {
            case 'week':
                inicio = new Date();
                inicio.setDate(inicio.getDate() - 7);
                break;
            case 'quarter':
                inicio = new Date();
                inicio.setMonth(inicio.getMonth() - 3);
                break;
            case 'year':
                inicio = new Date();
                inicio.setFullYear(inicio.getFullYear() - 1);
                break;
            case 'month':
            default:
                inicio = new Date();
                inicio.setMonth(inicio.getMonth() - 1);
                break;
        }
        // Si se proporcionan fechas específicas, tienen prioridad sobre el timeframe
        if (req.query.fechaInicio) {
            inicio = new Date(req.query.fechaInicio);
        }
        if (req.query.fechaFin) {
            fin = new Date(req.query.fechaFin);
        }
        console.log(`📊 Generando reporte de consumo de materias primas desde ${inicio.toISOString()} hasta ${fin.toISOString()}...`);
        // Obtener todas las materias primas
        const materiasPrimas = yield init_db_1.models.MateriaPrima.findAll({
            attributes: ['id', 'nombre', 'cantidad_stock', 'umbral_minimo', 'unidad_medida'],
            order: [['nombre', 'ASC']]
        });
        console.log(`📦 Obtenidas ${materiasPrimas.length} materias primas del inventario`);
        // Verificar si hay producciones en la base de datos (independiente del filtro de fechas)
        const allProducciones = yield init_db_1.models.Produccion.count();
        console.log(`📝 Total de producciones en la base de datos: ${allProducciones}`);
        // Si no hay producciones en la base de datos, generar datos simulados
        if (allProducciones === 0) {
            console.log('⚠️ No hay datos de producción en la base de datos. Generando datos simulados para demostración...');
            // Crear datos simulados de consumo para las primeras 5 materias primas (si existen)
            const consumoSimulado = materiasPrimas.slice(0, 5).map((mp, index) => {
                const item = mp.toJSON();
                // Generar cantidades simuladas basadas en el stock disponible
                const cantidadBase = Math.max(item.umbral_minimo * 0.5, 1);
                // Factor aleatorio para variar los datos (entre 1 y 3)
                const factor = 1 + (index % 3);
                return {
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: Math.round(cantidadBase * factor),
                    unidad_medida: item.unidad_medida,
                    porcentaje: 0 // Se calculará después
                };
            });
            // Calcular los porcentajes para los datos simulados
            const totalConsumo = consumoSimulado.reduce((sum, mp) => sum + mp.cantidad, 0);
            consumoSimulado.forEach(mp => {
                mp.porcentaje = Math.round((mp.cantidad / totalConsumo) * 100);
            });
            // Devolver la respuesta con datos simulados
            const response = {
                fechaInicio: inicio.toISOString().split('T')[0],
                fechaFin: fin.toISOString().split('T')[0],
                timeframe,
                materiasPrimas,
                materiasPrimasAgotadas: materiasPrimas.filter((mp) => mp.cantidad_stock === 0),
                materiasPrimasBajas: materiasPrimas.filter((mp) => mp.cantidad_stock > 0 && mp.cantidad_stock <= mp.umbral_minimo),
                consumoPorMateriaPrima: consumoSimulado,
                datosDemostracion: true // Indicar que estos son datos simulados
            };
            console.log('✅ Respuesta preparada con datos simulados para demostración');
            return res.status(200).json(response);
        }
        // Obtener todas las producciones en el período
        const producciones = yield init_db_1.models.Produccion.findAll({
            where: {
                fecha_hora: {
                    [sequelize_1.Op.between]: [inicio, fin]
                }
            },
            include: [
                {
                    model: init_db_1.models.Receta,
                    as: 'Recetum',
                    include: [
                        {
                            model: init_db_1.models.MateriaPrima,
                            as: 'MateriaPrimas',
                            through: {
                                attributes: ['cantidad', 'unidad_medida']
                            }
                        }
                    ]
                }
            ]
        });
        console.log(`📊 Encontradas ${producciones.length} producciones en el período seleccionado`);
        // Si no hay producciones en el período seleccionado, pero hay en la base de datos
        // intentar con un período más amplio para evitar datos vacíos
        if (producciones.length === 0) {
            console.log('⚠️ No se encontraron producciones en el período seleccionado. Intentando con un período más amplio...');
            // Verificar si hay producciones en la base de datos en cualquier período
            const todasProducciones = yield init_db_1.models.Produccion.findAll({
                limit: 10,
                order: [['fecha_hora', 'DESC']],
                include: [
                    {
                        model: init_db_1.models.Receta,
                        as: 'Recetum',
                        include: [
                            {
                                model: init_db_1.models.MateriaPrima,
                                as: 'MateriaPrimas',
                                through: {
                                    attributes: ['cantidad', 'unidad_medida']
                                }
                            }
                        ]
                    }
                ]
            });
            if (todasProducciones.length > 0) {
                console.log(`📊 Encontradas ${todasProducciones.length} producciones en total en la base de datos.`);
                // Usar estas producciones en lugar del período seleccionado
                producciones.push(...todasProducciones);
                console.log('⚠️ Usando todas las producciones disponibles independientemente del período seleccionado');
            }
            else {
                console.log('❌ No se encontraron producciones en la base de datos');
            }
        }
        // Calcular el consumo de cada materia prima en producción
        const consumoPorMateriaPrima = {};
        producciones.forEach((produccion) => {
            const receta = produccion.Recetum;
            if (!receta || !receta.MateriaPrimas) {
                console.log(`⚠️ Receta sin materias primas para producción ID=${produccion.id}`, receta);
                return;
            }
            const cantidad = produccion.cantidad;
            console.log(`🔍 Procesando producción ID=${produccion.id}, receta="${receta.nombre}", cantidad=${cantidad}`);
            receta.MateriaPrimas.forEach((materiaPrima) => {
                // Verificar si existe la relación RecetaMateriaPrima (o RecetaIngrediente)
                const recetaMPRelacion = materiaPrima.RecetaMateriaPrima || materiaPrima.RecetaIngrediente;
                if (!recetaMPRelacion) {
                    console.log(`⚠️ Falta relación entre receta y materia prima para: ${materiaPrima.nombre}`);
                    return;
                }
                const mpId = materiaPrima.id;
                const cantidadEnReceta = recetaMPRelacion.cantidad;
                const unidadMedida = recetaMPRelacion.unidad_medida;
                const consumoTotal = cantidadEnReceta * cantidad;
                console.log(`📦 Materia prima: ${materiaPrima.nombre}, cantidad en receta: ${cantidadEnReceta} ${unidadMedida}, consumo total: ${consumoTotal}`);
                if (!consumoPorMateriaPrima[mpId]) {
                    consumoPorMateriaPrima[mpId] = {
                        id: mpId,
                        nombre: materiaPrima.nombre,
                        cantidad: 0,
                        unidad_medida: unidadMedida
                    };
                }
                consumoPorMateriaPrima[mpId].cantidad += consumoTotal;
            });
        });
        // Convertir a array y ordenar por consumo
        const consumoArray = Object.values(consumoPorMateriaPrima)
            .sort((a, b) => b.cantidad - a.cantidad);
        console.log(`📊 Consumo calculado para ${consumoArray.length} materias primas`);
        // Si no hay datos de consumo, generar datos simulados para no mostrar gráficos vacíos
        if (consumoArray.length === 0) {
            console.log('⚠️ No hay datos de consumo. Generando datos simulados para demostración...');
            // Crear datos simulados de consumo para las primeras 5 materias primas (si existen)
            const consumoSimulado = materiasPrimas.slice(0, 5).map((mp, index) => {
                const item = mp.toJSON ? mp.toJSON() : mp;
                // Generar cantidades simuladas basadas en el stock disponible
                const cantidadBase = Math.max(item.umbral_minimo * 0.5, 1);
                // Factor aleatorio para variar los datos (entre 1 y 3)
                const factor = 1 + (index % 3);
                return {
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: Math.round(cantidadBase * factor),
                    unidad_medida: item.unidad_medida,
                    porcentaje: 0 // Se calculará después
                };
            });
            // Calcular los porcentajes para los datos simulados
            const totalConsumo = consumoSimulado.reduce((sum, mp) => sum + mp.cantidad, 0);
            consumoSimulado.forEach(mp => {
                mp.porcentaje = Math.round((mp.cantidad / totalConsumo) * 100);
            });
            // Devolver la respuesta con datos simulados
            const response = {
                fechaInicio: inicio.toISOString().split('T')[0],
                fechaFin: fin.toISOString().split('T')[0],
                timeframe,
                materiasPrimas,
                materiasPrimasAgotadas: materiasPrimas.filter((mp) => mp.cantidad_stock === 0),
                materiasPrimasBajas: materiasPrimas.filter((mp) => mp.cantidad_stock > 0 && mp.cantidad_stock <= mp.umbral_minimo),
                consumoPorMateriaPrima: consumoSimulado,
                datosDemostracion: true // Indicar que estos son datos simulados
            };
            console.log('✅ Respuesta preparada con datos simulados para demostración');
            return res.status(200).json(response);
        }
        // Clasificar materias primas por estado de inventario
        const materiasPrimasAgotadas = materiasPrimas.filter((mp) => mp.cantidad_stock === 0);
        const materiasPrimasBajas = materiasPrimas.filter((mp) => mp.cantidad_stock > 0 && mp.cantidad_stock <= mp.umbral_minimo);
        // Preparar respuesta
        const response = {
            fechaInicio: inicio.toISOString().split('T')[0],
            fechaFin: fin.toISOString().split('T')[0],
            timeframe,
            materiasPrimas,
            materiasPrimasAgotadas,
            materiasPrimasBajas,
            consumoPorMateriaPrima: consumoArray
        };
        console.log('✅ Reporte de consumo de materias primas generado');
        return res.status(200).json(response);
    }
    catch (error) {
        console.error('❌ Error al generar reporte de consumo de materias primas:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return res.status(500).json({
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? message : undefined
        });
    }
});
exports.getReporteConsumoMateriasPrimas = getReporteConsumoMateriasPrimas;
// Obtener resumen para el dashboard de reportes
const getDashboardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    console.log('📊 Petición recibida en getDashboardData');
    try {
        // Obtener fecha de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('📅 Fecha de hoy:', today);
        // Obtener fecha de inicio de semana (domingo)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        console.log('📅 Inicio de semana:', weekStart);
        // Obtener fecha de inicio de mes
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        console.log('📅 Inicio de mes:', monthStart);
        // Obtener ventas de hoy
        console.log('💰 Consultando ventas de hoy...');
        const ventasHoy = yield init_db_1.models.Venta.findAll({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('total')), 'total']
            ],
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: today
                }
            }
        });
        console.log('💰 Ventas de hoy:', ((_a = ventasHoy[0]) === null || _a === void 0 ? void 0 : _a.get('total')) || 0);
        // Obtener ventas de la semana
        console.log('💰 Consultando ventas de la semana...');
        const ventasSemana = yield init_db_1.models.Venta.findAll({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('total')), 'total']
            ],
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: weekStart
                }
            }
        });
        console.log('💰 Ventas de la semana:', ((_b = ventasSemana[0]) === null || _b === void 0 ? void 0 : _b.get('total')) || 0);
        // Obtener ventas del mes
        console.log('💰 Consultando ventas del mes...');
        const ventasMes = yield init_db_1.models.Venta.findAll({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('total')), 'total']
            ],
            where: {
                fecha_hora: {
                    [sequelize_1.Op.gte]: monthStart
                }
            }
        });
        console.log('💰 Ventas del mes:', ((_c = ventasMes[0]) === null || _c === void 0 ? void 0 : _c.get('total')) || 0);
        // Obtener productos más populares
        console.log('🍞 Consultando productos más populares...');
        let productosPopulares = [];
        let productosFormateados = [];
        try {
            productosPopulares = yield init_db_1.models.DetalleVenta.findAll({
                attributes: [
                    'RecetumId',
                    [database_1.default.fn('SUM', database_1.default.col('cantidad')), 'cantidad']
                ],
                include: [{
                        model: init_db_1.models.Venta,
                        as: 'Ventum',
                        attributes: [],
                        where: {
                            fecha_hora: {
                                [sequelize_1.Op.gte]: monthStart
                            }
                        },
                        required: true
                    }, {
                        model: init_db_1.models.Receta,
                        as: 'Recetum',
                        attributes: ['nombre'],
                        required: true
                    }],
                group: ['RecetumId', 'Recetum.id', 'Recetum.nombre'],
                order: [[database_1.default.fn('SUM', database_1.default.col('cantidad')), 'DESC']],
                limit: 5
            });
            console.log('🍞 Productos populares encontrados:', productosPopulares.length);
            // Calcular porcentajes de productos populares
            const totalProductosVendidos = productosPopulares.reduce((sum, item) => {
                return sum + parseInt(item.get('cantidad'), 10);
            }, 0);
            console.log('🍞 Total productos vendidos:', totalProductosVendidos);
            productosFormateados = productosPopulares.map((item) => {
                const cantidad = parseInt(item.get('cantidad'), 10);
                const porcentaje = totalProductosVendidos ? Math.round((cantidad / totalProductosVendidos) * 100) : 0;
                return {
                    id: item.get('RecetumId'),
                    nombre: item.Recetum.nombre,
                    cantidad,
                    porcentaje
                };
            });
        }
        catch (error) {
            console.error('❌ Error al consultar productos populares:', error);
            // Si hay error en los productos populares, continuamos con el resto del dashboard
        }
        // Obtener materias primas con stock bajo
        console.log('📦 Consultando materias primas con stock bajo...');
        let materiasConAlerta = [];
        try {
            materiasConAlerta = yield init_db_1.models.MateriaPrima.findAll({
                where: {
                    cantidad_stock: {
                        [sequelize_1.Op.lte]: database_1.default.col('umbral_minimo')
                    }
                },
                order: [
                    [database_1.default.literal('cantidad_stock / umbral_minimo'), 'ASC']
                ],
                limit: 5
            });
            console.log('📦 Materias primas con alerta encontradas:', materiasConAlerta.length);
        }
        catch (error) {
            console.error('❌ Error al consultar materias primas con stock bajo:', error);
            // Si hay error en las materias primas, continuamos con el resto del dashboard
        }
        // Calcular ganancias netas (podría requerir lógica adicional según la estructura de datos)
        // Para este ejemplo, usamos 30% del total de ventas del mes como estimación
        const gananciasNetas = Number((_d = ventasMes[0]) === null || _d === void 0 ? void 0 : _d.get('total')) * 0.3 || 0;
        console.log('💵 Ganancias netas estimadas:', gananciasNetas);
        // Formatear números a pesos colombianos
        const formatCOP = (value) => {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        };
        const response = {
            ventasHoy: Number((_e = ventasHoy[0]) === null || _e === void 0 ? void 0 : _e.get('total')) || 0,
            ventasHoyFormatted: formatCOP(Number((_f = ventasHoy[0]) === null || _f === void 0 ? void 0 : _f.get('total')) || 0),
            ventasSemana: Number((_g = ventasSemana[0]) === null || _g === void 0 ? void 0 : _g.get('total')) || 0,
            ventasSemanaFormatted: formatCOP(Number((_h = ventasSemana[0]) === null || _h === void 0 ? void 0 : _h.get('total')) || 0),
            ventasMes: Number((_j = ventasMes[0]) === null || _j === void 0 ? void 0 : _j.get('total')) || 0,
            ventasMesFormatted: formatCOP(Number((_k = ventasMes[0]) === null || _k === void 0 ? void 0 : _k.get('total')) || 0),
            productosPopulares: productosFormateados,
            inventarioBajo: materiasConAlerta,
            gananciasNetas,
            gananciasNetasFormatted: formatCOP(gananciasNetas)
        };
        console.log('✅ Respuesta preparada para enviar:', response);
        return res.status(200).json(response);
    }
    catch (error) {
        console.error('❌ Error al obtener datos del dashboard de reportes:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return res.status(500).json({
            message: 'Error en el servidor',
            details: process.env.NODE_ENV === 'development' ? message : undefined,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        });
    }
});
exports.getDashboardData = getDashboardData;
//# sourceMappingURL=reportesController.js.map