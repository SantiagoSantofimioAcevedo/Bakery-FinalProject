import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// Función para formatear valores a pesos colombianos
const formatCOP = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Obtener alertas de inventario
    const inventoryAlerts = await models.MateriaPrima.findAll({
      where: {
        cantidad_stock: {
          [Op.lte]: sequelize.col('umbral_minimo')
        }
      }
    });

    // Obtener productos más vendidos
    const topSellingProducts = await models.DetalleVenta.findAll({
      attributes: [
        'RecetumId',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad']
      ],
      include: [{
        model: models.Receta,
        attributes: ['nombre', 'id'],
        as: 'Recetum',
        required: false
      }],
      group: ['RecetumId', 'Recetum.id', 'Recetum.nombre'],
      order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
      limit: 5
    });

  
    console.log('Top selling products raw data:', JSON.stringify(topSellingProducts.map(p => ({
      recetaId: p.get('RecetumId'),
      recetaNombre: (p as any).Recetum?.nombre,
      cantidad: p.get('cantidad')
    })), null, 2));

    // Obtener resumen de ventas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const salesSummary = await models.Venta.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_hora: {
          [Op.gte]: today
        }
      }
    });

    const weeklySales = await models.Venta.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_hora: {
          [Op.gte]: weekStart
        }
      }
    });

    const monthlySales = await models.Venta.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        fecha_hora: {
          [Op.gte]: monthStart
        }
      }
    });

    // Obtener producción de hoy
    const productionToday = await models.Produccion.count({
      where: {
        fecha_hora: {
          [Op.gte]: today
        }
      }
    });

   
    const sinNombreProducts = topSellingProducts.filter(product => !(product as any).Recetum?.nombre);
    if (sinNombreProducts.length > 0) {
      console.log('Found products without names:', 
        sinNombreProducts.map(p => `RecetumId: ${p.get('RecetumId')}, Cantidad: ${p.get('cantidad')}`));
    }

    // Obtener valores de ventas como números
    const todaySales = Number(salesSummary[0]?.get('total')) || 0;
    const weekSales = Number(weeklySales[0]?.get('total')) || 0;
    const monthSales = Number(monthlySales[0]?.get('total')) || 0;

    return res.status(200).json({
      inventoryAlerts,
      topSellingProducts: topSellingProducts.map(product => {
        const recetumId = product.get('RecetumId');
        const nombre = (product as any).Recetum?.nombre || 'Sin nombre';
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
  } catch (error: any) {
    console.error('Error al obtener datos del dashboard:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      message: 'Error en el servidor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 