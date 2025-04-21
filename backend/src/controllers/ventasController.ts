// src/controllers/venta.controller.ts
import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';
import { Op } from 'sequelize';

interface Receta {
  id: number;
  nombre: string;
  precio_venta: number;
}

interface DetalleVenta {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  Recetum?: Receta;
  get(key: string): any;
}

// Obtener todas las ventas
export const getAllVentas = async (req: Request, res: Response) => {
  try {
    console.log("Ejecutando consulta para obtener ventas con detalles...");
    
    // Consultar todas las ventas con sus detalles y recetas en una sola consulta
    const ventas = await models.Venta.findAll({
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.DetalleVenta,
          as: 'DetalleVenta',
          include: [
            {
              model: models.Receta,
              as: 'Recetum',
              attributes: ['id', 'nombre', 'precio_venta']
            }
          ]
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    const ventasProcessed = ventas.map(venta => {
      const ventaJSON = venta.toJSON();
      // Asegurarse de que los detalles tengan la estructura correcta
      if (ventaJSON.DetalleVenta) {
        // Mantener compatibilidad con el frontend usando DetalleVentas
        ventaJSON.DetalleVentas = ventaJSON.DetalleVenta.map((detalle: any) => ({
          ...detalle,
          Receta: detalle.Recetum
        }));
      }
      return ventaJSON;
    });

    return res.status(200).json(ventasProcessed);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return res.status(500).json({ 
      message: 'Error en el servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener una venta por ID
export const getVentaById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      // Buscar la venta primero
      const venta = await models.Venta.findByPk(id, {
        include: [
          {
            model: models.Usuario,
            attributes: ['id', 'nombre', 'apellido', 'usuario']
          }
        ]
      });
  
      if (!venta) {
        return res.status(404).json({ message: 'Venta no encontrada' });
      }
      
      // Buscar detalles por separado
      const detalles = await models.DetalleVenta.findAll({
        where: { VentumId: id },
        include: [{
          model: models.Receta,
          as: 'Recetum',
          attributes: ['id', 'nombre', 'precio_venta']
        }]
      });
      
      // Calcular el total de la venta
      const ventaObj = venta.toJSON();
      const detallesJson = detalles.map(d => d.toJSON());
      
      console.log(`Detalles encontrados para venta ID ${id}:`, detallesJson.length);
      
      // Calcular total e incluir los detalles
      ventaObj.DetalleVenta = detallesJson;
      ventaObj.DetalleVentas = detallesJson;  // Por compatibilidad con frontend
      ventaObj.total = detallesJson.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  
      return res.status(200).json(ventaObj);
    } catch (error) {
      console.error('Error al obtener venta:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };
  

// Función auxiliar para obtener la cantidad disponible de un producto
export const getProductoDisponible = async (recetaId: number) => {
  try {
    // Buscar todas las producciones para esta receta
    const producciones = await models.Produccion.findAll({
      where: {
        RecetaId: recetaId
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_producido']
      ],
      raw: true
    }) as unknown as { total_producido: number }[];

    // Buscar todas las ventas para esta receta
    const ventas = await models.DetalleVenta.findAll({
      where: {
        RecetumId: recetaId
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido']
      ],
      raw: true
    }) as unknown as { total_vendido: number }[];

    // Calcular la cantidad disponible
    const totalProducido = producciones[0]?.total_producido || 0;
    const totalVendido = ventas[0]?.total_vendido || 0;
    const disponible = totalProducido - totalVendido;

    return {
      recetaId,
      totalProducido,
      totalVendido,
      disponible
    };
  } catch (error) {
    console.error(`Error al obtener disponibilidad para receta ${recetaId}:`, error);
    throw error;
  }
};

// Crear una nueva venta
export const createVenta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { detalles } = req.body;
    
    if (!req.usuario) {
      await t.rollback();
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const usuarioId = req.usuario.id;

    console.log("Datos recibidos para crear venta:", JSON.stringify(detalles, null, 2));

    // Validar que hay detalles de venta
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Debe incluir al menos un producto en la venta' });
    }

    // Crear la venta con total inicializado a 0
    const nuevaVenta = await models.Venta.create({
      UsuarioId: usuarioId,
      fecha_hora: new Date(),
      total: 0, // Inicialmente se establece en 0
      metodo_pago: 'Efectivo' // Establecer método de pago por defecto
    }, { transaction: t });

    console.log("Venta creada con ID:", nuevaVenta.get('id'));

    // Crear los detalles de venta
    let totalVenta = 0;
    
    // Verificar disponibilidad de inventario para todos los productos
    const erroresInventario = [];
    
    for (const detalle of detalles) {
      const { recetaId, cantidad } = detalle;

      // Verificar que la receta existe
      const receta = await models.Receta.findByPk(recetaId);
      if (!receta) {
        await t.rollback();
        return res.status(404).json({ message: `Receta con ID ${recetaId} no encontrada` });
      }
      
      // Verificar disponibilidad en inventario
      try {
        const disponibilidad = await getProductoDisponible(recetaId);
        
        console.log(`Verificando disponibilidad para receta ${recetaId}:`, disponibilidad);
        
        if (!disponibilidad || disponibilidad.disponible < cantidad) {
          erroresInventario.push({
            receta: receta.get('nombre'),
            disponible: disponibilidad ? disponibilidad.disponible : 0,
            solicitado: cantidad
          });
        }
      } catch (error) {
        console.error(`Error al verificar disponibilidad para receta ${recetaId}:`, error);
        await t.rollback();
        return res.status(500).json({ 
          message: 'Error al verificar disponibilidad de inventario',
          details: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    // Si hay errores de inventario, no permitir la venta
    if (erroresInventario.length > 0) {
      await t.rollback();
      return res.status(400).json({
        message: 'No hay suficiente inventario para completar la venta',
        errores: erroresInventario
      });
    }
    
    // Proceder con la creación de la venta si hay suficiente inventario
    for (const detalle of detalles) {
      const { recetaId, cantidad } = detalle;
      
      // La receta ya fue verificada anteriormente, pero para TypeScript la volvemos a verificar
      const receta = await models.Receta.findByPk(recetaId);
      if (!receta) {
        await t.rollback();
        return res.status(404).json({ message: `Receta con ID ${recetaId} no encontrada` });
      }
      
      const precio = receta.get('precio_venta') as number;
      const subtotal = precio * cantidad;
      totalVenta += subtotal;

      // Crear el detalle de venta
      console.log('Creando detalle de venta:', {
        ventaId: nuevaVenta.get('id'),
        recetaId,
        cantidad,
        precio_unitario: precio,
        subtotal
      });

      try {
        // Crear el detalle con las claves foráneas correctas
        const nuevoDetalle = await models.DetalleVenta.create({
          VentumId: nuevaVenta.get('id') as number,
          RecetumId: recetaId,
          cantidad,
          precio_unitario: precio,
          subtotal
        }, { transaction: t });
        
        console.log(`Detalle de venta creado correctamente con ID ${nuevoDetalle.get('id')}`);
      } catch (error) {
        console.error('Error al crear detalle de venta:', error);
        throw error;
      }
    }

    // IMPORTANTE: Actualizar el total de la venta antes de confirmar la transacción
    await nuevaVenta.update({ total: totalVenta }, { transaction: t });
    console.log(`Total de venta actualizado: $${totalVenta.toFixed(2)}`);

    // Confirmar la transacción
    await t.commit();
    console.log("Transacción confirmada, obteniendo venta completa...");

    // Obtener la venta completa con los detalles usando nuestro nuevo enfoque
    const ventaId = nuevaVenta.get('id') as number;
    
    // Buscar la venta
    const ventaCompleta = await models.Venta.findByPk(ventaId, {
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        }
      ]
    });

    if (!ventaCompleta) {
      return res.status(500).json({ message: 'Error: No se pudo recuperar la venta creada' });
    }
    
    // Buscar detalles por separado
    const detallesVenta = await models.DetalleVenta.findAll({
      where: { VentumId: ventaId },
      include: [{
        model: models.Receta,
        as: 'Recetum',
        attributes: ['id', 'nombre', 'precio_venta']
      }]
    });
    
    // Procesar la respuesta
    const ventaObj = ventaCompleta.toJSON();
    const detallesJson = detallesVenta.map(d => d.toJSON());
    
    console.log(`Detalles recuperados para la venta creada (ID ${ventaId}):`, detallesJson.length);
    
    ventaObj.DetalleVenta = detallesJson;
    ventaObj.DetalleVentas = detallesJson;
    ventaObj.total = totalVenta;

    return res.status(201).json(ventaObj);
  } catch (error) {
    try {
      // Intentar hacer rollback solo si la transacción no ha sido completada
      await t.rollback();
    } catch (rollbackError) {
      // Si falla el rollback, probablemente la transacción ya fue completada
      console.error('Error al hacer rollback:', rollbackError);
    }
    console.error('Error al crear venta:', error);
    
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return res.status(500).json({ 
      message: 'Error en el servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
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

// Eliminar una venta
export const deleteVenta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    
    console.log(`Intentando eliminar venta con ID: ${id}`);

    // Primero eliminar los detalles de venta asociados
    await models.DetalleVenta.destroy({
      where: { VentumId: id },
      transaction: t
    });

    // Luego eliminar la venta
    const resultado = await models.Venta.destroy({
      where: { id },
      transaction: t
    });

    if (resultado === 0) {
      await t.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Confirmar la transacción
    await t.commit();

    console.log(`Venta con ID ${id} eliminada correctamente`);
    return res.status(200).json({
      message: 'Venta eliminada correctamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar venta:', error);
    
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return res.status(500).json({ 
      message: 'Error en el servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener ventas del día actual
export const getVentasDiarias = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Primero obtener las ventas
    const ventas = await models.Venta.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        {
          model: models.Usuario,
          attributes: ['nombre', 'apellido']
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    // Luego obtener los detalles para cada venta
    const ventasConDetalles = await Promise.all(
      ventas.map(async (venta) => {
        const ventaId = venta.get('id');
        
        // Obtener detalles de la venta
        const detalles = await models.DetalleVenta.findAll({
          where: { VentumId: ventaId },
          include: [{
            model: models.Receta,
            as: 'Recetum',
            attributes: ['nombre']
          }]
        });

        const ventaJSON = venta.toJSON();
        const detallesJSON = detalles.map(detalle => {
          const detalleData = detalle.toJSON();
          const recetum = detalleData.Recetum as Receta;
          return {
            id: detalleData.id,
            cantidad: detalleData.cantidad,
            precio_unitario: detalleData.precio_unitario,
            subtotal: detalleData.subtotal,
            Receta: {
              nombre: recetum.nombre
            }
          };
        });

        return {
          ...ventaJSON,
          metodo_pago: ventaJSON.metodo_pago || 'Efectivo', // Asegurar que siempre haya un método de pago
          DetalleVentas: detallesJSON
        };
      })
    );

    res.json(ventasConDetalles);
  } catch (error) {
    console.error('Error al obtener ventas diarias:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas diarias',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener ventas de la semana actual
export const getVentasSemanales = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener el inicio de la semana (domingo)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Retroceder al domingo
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Obtener el fin de la semana (sábado)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    // Obtener las ventas
    const ventas = await models.Venta.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: startOfWeek,
          [Op.lt]: endOfWeek
        }
      },
      include: [
        {
          model: models.Usuario,
          attributes: ['nombre', 'apellido']
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    // Obtener los detalles para cada venta
    const ventasConDetalles = await Promise.all(
      ventas.map(async (venta) => {
        const ventaId = venta.get('id');
        
        // Obtener detalles de la venta
        const detalles = await models.DetalleVenta.findAll({
          where: { VentumId: ventaId },
          include: [{
            model: models.Receta,
            as: 'Recetum',
            attributes: ['nombre']
          }]
        });

        const ventaJSON = venta.toJSON();
        const detallesJSON = detalles.map(detalle => {
          const detalleData = detalle.toJSON();
          const recetum = detalleData.Recetum as Receta;
          return {
            id: detalleData.id,
            cantidad: detalleData.cantidad,
            precio_unitario: detalleData.precio_unitario,
            subtotal: detalleData.subtotal,
            Receta: {
              nombre: recetum.nombre
            }
          };
        });

        return {
          ...ventaJSON,
          metodo_pago: ventaJSON.metodo_pago || 'Efectivo', // Asegurar que siempre haya un método de pago
          DetalleVentas: detallesJSON
        };
      })
    );

    res.json(ventasConDetalles);
  } catch (error) {
    console.error('Error al obtener ventas semanales:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas semanales',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener ventas del mes actual
export const getVentasMensuales = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener el inicio del mes actual
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Obtener el inicio del próximo mes
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Obtener las ventas
    const ventas = await models.Venta.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      include: [
        {
          model: models.Usuario,
          attributes: ['nombre', 'apellido']
        },
        {
          model: models.DetalleVenta,
          as: 'DetalleVenta',
          include: [{
            model: models.Receta,
            as: 'Recetum',
            attributes: ['nombre']
          }]
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas mensuales:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas mensuales',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Actualizar una venta
export const updateVenta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { detalles, total, metodo_pago } = req.body;

    console.log('Datos recibidos para actualización:', {
      id,
      detalles,
      total,
      metodo_pago
    });

    // Buscar la venta
    const venta = await models.Venta.findByPk(id);
    if (!venta) {
      await t.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Validar que todas las recetas existan y obtener sus datos
    const recetasMap = new Map();
    for (const detalle of detalles) {
      const recetaId = detalle.RecetumId;
      console.log(`Buscando receta con ID: ${recetaId}`);
      
      const receta = await models.Receta.findByPk(recetaId);
      if (!receta && recetaId !== 0) {  // Permitir RecetumId 0 para mantener compatibilidad
        await t.rollback();
        return res.status(400).json({ 
          message: `La receta con ID ${recetaId} no existe`,
          details: `No se puede actualizar la venta porque uno de los productos ya no existe en el sistema`
        });
      }
      if (receta) {
        recetasMap.set(receta.get('id'), receta);
      }
    }

    // Eliminar los detalles existentes
    await models.DetalleVenta.destroy({
      where: { VentumId: id },
      transaction: t
    });

    // Crear los nuevos detalles
    const nuevosDetalles = [];
    for (const detalle of detalles) {
      console.log('Creando nuevo detalle:', detalle);
      const nuevoDetalle = await models.DetalleVenta.create({
        VentumId: id,
        RecetumId: detalle.RecetumId,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal
      }, { transaction: t });
      nuevosDetalles.push(nuevoDetalle);
    }

    // Actualizar la venta
    await venta.update({
      total,
      metodo_pago: metodo_pago || 'Efectivo'
    }, { transaction: t });

    // Confirmar la transacción
    await t.commit();

    // Obtener la venta actualizada con todos sus detalles
    const ventaActualizada = await models.Venta.findOne({
      where: { id },
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.DetalleVenta,
          as: 'DetalleVenta',
          include: [
            {
              model: models.Receta,
              as: 'Recetum',
              attributes: ['id', 'nombre', 'precio_venta']
            }
          ]
        }
      ]
    });

    if (!ventaActualizada) {
      return res.status(500).json({ message: 'Error al recuperar la venta actualizada' });
    }

    // Procesar la respuesta para mantener consistencia con el frontend
    const ventaJSON = ventaActualizada.toJSON();
    
    // Asegurarse de que DetalleVentas existe y tiene la estructura correcta
    ventaJSON.DetalleVentas = ventaJSON.DetalleVenta.map((detalle: any) => {
      return {
        ...detalle,
        Receta: detalle.Recetum || {
          id: detalle.RecetumId,
          nombre: 'Producto no encontrado',
          precio_venta: detalle.precio_unitario
        }
      };
    });

    delete ventaJSON.DetalleVenta; // Eliminar la propiedad antigua

    console.log('Venta actualizada:', JSON.stringify(ventaJSON, null, 2));
    return res.status(200).json(ventaJSON);
  } catch (error) {
    try {
      await t.rollback();
    } catch (rollbackError) {
      console.error('Error al hacer rollback:', rollbackError);
    }
    console.error('Error al actualizar venta:', error);
    return res.status(500).json({ 
      message: 'Error en el servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener ventas por rango de fechas
export const getVentasPorRango = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      res.status(400).json({ message: 'Se requieren fechaInicio y fechaFin' });
      return;
    }

    const startDate = new Date(fechaInicio as string);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(fechaFin as string);
    endDate.setHours(23, 59, 59, 999);

    console.log('Consultando ventas por rango:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Obtener las ventas
    const ventas = await models.Venta.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      },
      include: [
        {
          model: models.Usuario,
          attributes: ['nombre', 'apellido']
        }
      ],
      order: [['fecha_hora', 'ASC']]
    });

    // Obtener los detalles para cada venta
    const ventasConDetalles = await Promise.all(
      ventas.map(async (venta) => {
        const ventaId = venta.get('id');
        
        // Obtener detalles de la venta
        const detalles = await models.DetalleVenta.findAll({
          where: { VentumId: ventaId },
          include: [{
            model: models.Receta,
            as: 'Recetum',
            attributes: ['nombre']
          }]
        });

        const ventaJSON = venta.toJSON();
        const detallesJSON = detalles.map(detalle => {
          const detalleData = detalle.toJSON();
          const recetum = detalleData.Recetum;
          return {
            id: detalleData.id,
            cantidad: detalleData.cantidad,
            precio_unitario: detalleData.precio_unitario,
            subtotal: detalleData.subtotal,
            Receta: {
              nombre: recetum.nombre
            }
          };
        });

        return {
          ...ventaJSON,
          metodo_pago: ventaJSON.metodo_pago || 'Efectivo',
          DetalleVentas: detallesJSON
        };
      })
    );

    res.json(ventasConDetalles);
  } catch (error) {
    console.error('Error al obtener ventas por rango:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas por rango',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};