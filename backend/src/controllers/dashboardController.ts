import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';
import { Op } from 'sequelize';

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
        attributes: ['nombre']
      }],
      group: ['RecetumId', 'Recetum.id', 'Recetum.nombre'],
      order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
      limit: 5
    });

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

    return res.status(200).json({
      inventoryAlerts,
      topSellingProducts: topSellingProducts.map(product => ({
        id: product.get('RecetumId'),
        nombre: (product as any).Receta?.nombre || 'Sin nombre',
        cantidad: product.get('cantidad')
      })),
      salesSummary: {
        today: salesSummary[0]?.get('total') || 0,
        week: weeklySales[0]?.get('total') || 0,
        month: monthlySales[0]?.get('total') || 0
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