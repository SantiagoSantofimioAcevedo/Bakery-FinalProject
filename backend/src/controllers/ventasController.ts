// src/controllers/venta.controller.ts
import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';

// Obtener todas las ventas
export const getAllVentas = async (req: Request, res: Response) => {
  try {
    const ventas = await models.Venta.findAll({
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
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
      order: [['fecha_hora', 'DESC']]
    });

    const ventasConTotal = ventas.map(venta => {
        const ventaObj = venta.toJSON();
        ventaObj.total = ventaObj.DetalleVentas && ventaObj.DetalleVentas.length > 0
          ? ventaObj.DetalleVentas.reduce((sum: number, detalle: any) => sum + detalle.subtotal, 0)
          : 0;
        return ventaObj;
      });

    return res.status(200).json(ventasConTotal);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener una venta por ID
export const getVentaById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const venta = await models.Venta.findByPk(id, {
        include: [
          {
            model: models.Usuario,
            attributes: ['id', 'nombre', 'apellido', 'usuario']
          },
          {
            model: models.DetalleVenta,
            include: [
              {
                model: models.Receta,
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
        ? ventaObj.DetalleVentas.reduce((sum: number, detalle: any) => sum + detalle.subtotal, 0)
        : 0; // Si no hay detalles, el total es 0
  
      return res.status(200).json(ventaObj);
    } catch (error) {
      console.error('Error al obtener venta:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };
  

// Crear una nueva venta
export const createVenta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { detalles } = req.body;
    const usuarioId = (req as any).user.id; // Obtenido del middleware de autenticación

    // Validar que hay detalles de venta
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Debe incluir al menos un producto en la venta' });
    }

    // Crear la venta
    const nuevaVenta = await models.Venta.create({
      UsuarioId: usuarioId,
      fecha_hora: new Date()
    }, { transaction: t });

    // Crear los detalles de venta
    let totalVenta = 0;
    for (const detalle of detalles) {
      const { recetaId, cantidad } = detalle;

      // Verificar que la receta existe
      const receta = await models.Receta.findByPk(recetaId);
      if (!receta) {
        await t.rollback();
        return res.status(404).json({ message: `Receta con ID ${recetaId} no encontrada` });
      }

      const precio = receta.get('precio_venta') as number;
      const subtotal = precio * cantidad;
      totalVenta += subtotal;

      // Crear el detalle de venta
      await models.DetalleVenta.create({
        VentaId: nuevaVenta.get('id') as number,
        RecetaId: recetaId,
        cantidad,
        precio_unitario: precio,
        subtotal
      }, { transaction: t });
    }

    // Confirmar la transacción
    await t.commit();

    // Obtener la venta completa con los detalles
    const ventaId = nuevaVenta.get('id') as number;
    const ventaCompleta = await models.Venta.findByPk(ventaId, {
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.DetalleVenta,
          include: [
            {
              model: models.Receta,
              attributes: ['id', 'nombre', 'precio_venta']
            }
          ]
        }
      ]
    });

    if (!ventaCompleta) {
      // Esto no debería ocurrir ya que acabamos de crear la venta
      await t.rollback();
      return res.status(500).json({ message: 'Error: No se pudo recuperar la venta creada' });
    }

    // Calcular el total de la venta
    const ventaObj = ventaCompleta.toJSON();
    ventaObj.total = totalVenta;

    return res.status(201).json(ventaObj);
  } catch (error) {
    await t.rollback();
    console.error('Error al crear venta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
  
};


// Anular una venta
export const anularVenta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioId = (req as any).user.id; // Obtenido del middleware de autenticación

    // Verificar que se proporciona un motivo
    if (!motivo) {
      await t.rollback();
      return res.status(400).json({ message: 'Debe proporcionar un motivo para anular la venta' });
    }

    // Buscar la venta
    const venta = await models.Venta.findByPk(id, {
      include: [
        {
          model: models.DetalleVenta
        }
      ]
    });

    if (!venta) {
      await t.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Verificar que la venta no esté ya anulada
    if (venta.get('anulada')) {
      await t.rollback();
      return res.status(400).json({ message: 'Esta venta ya fue anulada' });
    }

    // Marcar la venta como anulada
    await venta.update({
      anulada: true,
      motivo_anulacion: motivo,
      usuario_anulacion_id: usuarioId,
      fecha_anulacion: new Date()
    }, { transaction: t });

    // Confirmar la transacción
    await t.commit();

    return res.status(200).json({
      message: 'Venta anulada correctamente',
      venta: venta.toJSON()
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al anular venta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};