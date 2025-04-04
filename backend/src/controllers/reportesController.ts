import { Request, Response, NextFunction } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// Interfaces para los modelos
interface VentaInstance {
  get(key: string): any;
  DetalleVentas?: DetalleVentaInstance[];
}

interface DetalleVentaInstance {
  RecetaId: number;
  cantidad: number;
  subtotal: number;
  Receta: RecetaInstance;
}

interface RecetaInstance {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_venta?: number;
  MateriaPrimas?: MateriaPrimaInstance[];
}

interface MateriaPrimaInstance {
  id: number;
  nombre: string;
  cantidad_stock: number;
  umbral_minimo: number;
  RecetaMateriaPrima?: {
    cantidad: number;
    unidad_medida: string;
  };
}

interface ProduccionInstance {
  get(key: string): any;
  RecetaId: number;
  cantidad: number;
  Usuario?: {
    nombre: string;
    apellido: string;
  };
  Receta?: RecetaInstance;
}

// Extender el tipo Request para añadir las fechas procesadas
declare global {
  namespace Express {
    interface Request {
      fechaInicio?: Date;
      fechaFin?: Date;
    }
  }
}

// Middleware para validar y procesar fechas
export const validarFechas = (req: Request, res: Response, next: NextFunction) => {
  const { fechaInicio, fechaFin } = req.query;
  
  if (!fechaInicio || !fechaFin) {
    const error = new Error('Debe proporcionar fechas de inicio y fin');
    return next(error);
  }
  
  try {
    // Crear objetos Date con las fechas proporcionadas
    const inicio = new Date(fechaInicio as string);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fechaFin as string);
    fin.setHours(23, 59, 59, 999);
    
    // Añadir las fechas procesadas al request
    req.fechaInicio = inicio;
    req.fechaFin = fin;
    next();
  } catch (error) {
    const err = new Error('Formato de fecha inválido');
    next(err);
  }
};

// Función auxiliar para formatear fechas
const formatearFecha = (fecha: Date): string => {
  return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Reporte de ventas por período
export const getReporteVentas = async (req: Request, res: Response) => {
  try {
    const inicio = req.fechaInicio!;
    const fin = req.fechaFin!;
    
    // Obtener todas las ventas en el período
    const ventas = await models.Venta.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [inicio, fin]
        }
      },
      include: [
        {
          model: models.DetalleVenta,
          include: [
            {
              model: models.Receta,
              attributes: ['id', 'nombre', 'precio_venta']
            }
          ]
        }
      ],
      order: [['fecha_hora', 'ASC']]
    });
    
    // Calcular totales y agrupar por día
    const ventasPorDia: Record<string, any> = {};
    let totalVentas = 0;
    let totalProductos = 0;
    
    ventas.forEach((venta: any) => {
      const fecha = new Date(venta.get('fecha_hora') as Date);
      const diaKey = formatearFecha(fecha);
      
      if (!ventasPorDia[diaKey]) {
        ventasPorDia[diaKey] = {
          fecha: diaKey,
          totalDia: 0,
          cantidadVentas: 0,
          productos: []
        };
      }
      
      const detalles = venta.get('DetalleVentas') as DetalleVentaInstance[];
      if (!detalles || !Array.isArray(detalles)) {
        return; // Skip if detalles is not available or not an array
      }
      
      let subtotal = 0;
      
      detalles.forEach(detalle => {
        subtotal += detalle.subtotal;
        totalProductos += detalle.cantidad;
        
        // Agregar o actualizar producto en el registro diario
        const productoIndex = ventasPorDia[diaKey].productos.findIndex((p: any) => p.id === detalle.RecetaId);
        if (productoIndex >= 0) {
          ventasPorDia[diaKey].productos[productoIndex].cantidad += detalle.cantidad;
          ventasPorDia[diaKey].productos[productoIndex].total += detalle.subtotal;
        } else {
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
    Object.values(ventasPorDia).forEach((dia: any) => {
      dia.productos.sort((a: any, b: any) => b.cantidad - a.cantidad);
    });
    
    // Crear resumen por producto
    const productosTotales: Record<string | number, any> = {};
    Object.values(ventasPorDia).forEach((dia: any) => {
      dia.productos.forEach((prod: any) => {
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
    const resumenProductos = Object.values(productosTotales).sort((a: any, b: any) => b.cantidad - a.cantidad);
    
    return res.status(200).json({
      fechaInicio: formatearFecha(inicio),
      fechaFin: formatearFecha(fin),
      totalVentas,
      totalProductos,
      cantidadVentas: ventas.length,
      ventasPorDia: Object.values(ventasPorDia),
      resumenProductos
    });
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      message: 'Error en el servidor', 
      details: process.env.NODE_ENV === 'development' ? message : undefined 
    });
  }
};

// Reporte de inventario y alertas
export const getReporteInventario = async (req: Request, res: Response) => {
  try {
    // Obtener todas las materias primas
    const materiasPrimas = await models.MateriaPrima.findAll({
      order: [['nombre', 'ASC']]
    });
    
    // Separar en materias primas normales y con alertas
    const materiasPrimasNormales: any[] = [];
    const materiasConAlerta: any[] = [];
    
    materiasPrimas.forEach((item: any) => {
      const itemObj = item.toJSON();
      
      // Verificar si está por debajo del umbral mínimo
      if (itemObj.cantidad_stock <= itemObj.umbral_minimo) {
        itemObj.porcentajeStock = Math.round((itemObj.cantidad_stock / itemObj.umbral_minimo) * 100);
        materiasConAlerta.push(itemObj);
      } else {
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
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      message: 'Error en el servidor', 
      details: process.env.NODE_ENV === 'development' ? message : undefined 
    });
  }
};

// Reporte de producción por período
export const getReporteProduccion = async (req: Request, res: Response) => {
  try {
    const inicio = req.fechaInicio!;
    const fin = req.fechaFin!;
    
    // Obtener todas las producciones en el período
    const producciones = await models.Produccion.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [inicio, fin]
        }
      },
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: models.Receta,
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha_hora', 'ASC']]
    });
    
    // Agrupar por día y por receta
    const produccionPorDia: Record<string, any> = {};
    const recetasTotales: Record<string | number, any> = {};
    let totalProducido = 0;
    
    producciones.forEach((prod: any) => {
      const fecha = new Date(prod.get('fecha_hora') as Date);
      const diaKey = formatearFecha(fecha);
      const recetaId = prod.get('RecetaId');
      const cantidad = prod.get('cantidad');
      const receta = prod.get('Receta');
      const usuario = prod.get('Usuario');
      
      if (!receta) return; // Skip if receta is not available
      
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
      produccionPorDia[dia].recetas.sort((a: any, b: any) => b.cantidad - a.cantidad);
    });
    
    // Convertir recetas totales de objeto a array ordenado por cantidad
    const resumenRecetas = Object.values(recetasTotales).sort((a: any, b: any) => b.cantidad - a.cantidad);
    
    return res.status(200).json({
      fechaInicio: formatearFecha(inicio),
      fechaFin: formatearFecha(fin),
      totalProducido,
      cantidadProducciones: producciones.length,
      produccionPorDia: Object.values(produccionPorDia),
      resumenRecetas
    });
  } catch (error) {
    console.error('Error al generar reporte de producción:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      message: 'Error en el servidor', 
      details: process.env.NODE_ENV === 'development' ? message : undefined 
    });
  }
};

// Reporte de consumo de materias primas por período
export const getReporteConsumoMateriasPrimas = async (req: Request, res: Response) => {
  try {
    const inicio = req.fechaInicio!;
    const fin = req.fechaFin!;
    
    // Obtener todas las producciones en el período con sus recetas y materias primas
    const producciones = await models.Produccion.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [inicio, fin]
        }
      },
      include: [
        {
          model: models.Receta,
          include: [
            {
              model: models.MateriaPrima,
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
    const materiasPrimasConsumidas: Record<string | number, any> = {};
    let totalMateriasPrimas = 0;
    
    producciones.forEach((prod: any) => {
      const cantidad = prod.get('cantidad');
      const receta = prod.get('Receta');
      
      if (!receta || !receta.MateriaPrimas || !Array.isArray(receta.MateriaPrimas)) {
        return; // Skip if materias primas data is not available
      }
      
      receta.MateriaPrimas.forEach((mp: MateriaPrimaInstance) => {
        const mpId = mp.id;
        const mpReceta = mp.RecetaMateriaPrima;
        
        if (!mpReceta) return; // Skip if relation data is not available
        
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
    const resumenMateriasPrimas = Object.values(materiasPrimasConsumidas).sort((a: any, b: any) => b.cantidad - a.cantidad);
    
    return res.status(200).json({
      fechaInicio: formatearFecha(inicio),
      fechaFin: formatearFecha(fin),
      totalMateriasPrimas,
      materiasPrimasConsumidas: resumenMateriasPrimas
    });
  } catch (error) {
    console.error('Error al generar reporte de consumo de materias primas:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      message: 'Error en el servidor', 
      details: process.env.NODE_ENV === 'development' ? message : undefined 
    });
  }
};

// Obtener resumen para el dashboard de reportes
export const getDashboardData = async (req: Request, res: Response) => {
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
    const ventasHoy = await models.Venta.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_hora: {
          [Op.gte]: today
        }
      }
    });
    console.log('💰 Ventas de hoy:', ventasHoy[0]?.get('total') || 0);
    
    // Obtener ventas de la semana
    console.log('💰 Consultando ventas de la semana...');
    const ventasSemana = await models.Venta.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_hora: {
          [Op.gte]: weekStart
        }
      }
    });
    console.log('💰 Ventas de la semana:', ventasSemana[0]?.get('total') || 0);
    
    // Obtener ventas del mes
    console.log('💰 Consultando ventas del mes...');
    const ventasMes = await models.Venta.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_hora: {
          [Op.gte]: monthStart
        }
      }
    });
    console.log('💰 Ventas del mes:', ventasMes[0]?.get('total') || 0);
    
    // Obtener productos más populares
    console.log('🍞 Consultando productos más populares...');
    let productosPopulares: any[] = [];
    let productosFormateados: Array<{id: number, nombre: string, cantidad: number, porcentaje: number}> = [];
    try {
      productosPopulares = await models.DetalleVenta.findAll({
        attributes: [
          'RecetumId',
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad']
        ],
        include: [{
          model: models.Venta,
          as: 'Ventum',
          attributes: [],
          where: {
            fecha_hora: {
              [Op.gte]: monthStart
            }
          },
          required: true
        }, {
          model: models.Receta,
          as: 'Recetum',
          attributes: ['nombre'],
          required: true
        }],
        group: ['RecetumId', 'Recetum.id', 'Recetum.nombre'],
        order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
        limit: 5
      });
      console.log('🍞 Productos populares encontrados:', productosPopulares.length);
      
      // Calcular porcentajes de productos populares
      const totalProductosVendidos = productosPopulares.reduce((sum: number, item: any) => {
        return sum + parseInt(item.get('cantidad'), 10);
      }, 0);
      console.log('🍞 Total productos vendidos:', totalProductosVendidos);
      
      productosFormateados = productosPopulares.map((item: any) => {
        const cantidad = parseInt(item.get('cantidad'), 10);
        const porcentaje = totalProductosVendidos ? Math.round((cantidad / totalProductosVendidos) * 100) : 0;
        return {
          id: item.get('RecetumId'),
          nombre: item.Recetum.nombre,
          cantidad,
          porcentaje
        };
      });
    } catch (error) {
      console.error('❌ Error al consultar productos populares:', error);
      // Si hay error en los productos populares, continuamos con el resto del dashboard
    }
    
    // Obtener materias primas con stock bajo
    console.log('📦 Consultando materias primas con stock bajo...');
    let materiasConAlerta: any[] = [];
    try {
      materiasConAlerta = await models.MateriaPrima.findAll({
        where: {
          cantidad_stock: {
            [Op.lte]: sequelize.col('umbral_minimo')
          }
        },
        order: [
          [sequelize.literal('cantidad_stock / umbral_minimo'), 'ASC']
        ],
        limit: 5
      });
      console.log('📦 Materias primas con alerta encontradas:', materiasConAlerta.length);
    } catch (error) {
      console.error('❌ Error al consultar materias primas con stock bajo:', error);
      // Si hay error en las materias primas, continuamos con el resto del dashboard
    }
    
    // Calcular ganancias netas (podría requerir lógica adicional según la estructura de datos)
    // Para este ejemplo, usamos 30% del total de ventas del mes como estimación
    const gananciasNetas = Number(ventasMes[0]?.get('total')) * 0.3 || 0;
    console.log('💵 Ganancias netas estimadas:', gananciasNetas);
    
    // Formatear números a pesos colombianos
    const formatCOP = (value: number): string => {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };
    
    const response = {
      ventasHoy: Number(ventasHoy[0]?.get('total')) || 0,
      ventasHoyFormatted: formatCOP(Number(ventasHoy[0]?.get('total')) || 0),
      ventasSemana: Number(ventasSemana[0]?.get('total')) || 0,
      ventasSemanaFormatted: formatCOP(Number(ventasSemana[0]?.get('total')) || 0),
      ventasMes: Number(ventasMes[0]?.get('total')) || 0,
      ventasMesFormatted: formatCOP(Number(ventasMes[0]?.get('total')) || 0),
      productosPopulares: productosFormateados,
      inventarioBajo: materiasConAlerta,
      gananciasNetas,
      gananciasNetasFormatted: formatCOP(gananciasNetas)
    };
    
    console.log('✅ Respuesta preparada para enviar:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error al obtener datos del dashboard de reportes:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      message: 'Error en el servidor', 
      details: process.env.NODE_ENV === 'development' ? message : undefined,
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
};