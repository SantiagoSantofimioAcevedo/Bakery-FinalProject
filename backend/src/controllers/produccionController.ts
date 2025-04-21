import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize, { Op } from '../config/database'; // Importar Op directamente
import { convertirUnidades } from '../utils/unitConversion';

// Obtener todas las producciones
export const getAllProducciones = async (req: Request, res: Response) => {
  try {
    const producciones = await models.Produccion.findAll({
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.Receta,
          as: 'Recetum',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    console.log('Producciones obtenidas:', JSON.stringify(producciones, null, 2));
    return res.status(200).json(producciones);
  } catch (error) {
    console.error('Error al obtener producciones:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener una producción por ID
export const getProduccionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const produccion = await models.Produccion.findByPk(id, {
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.Receta,
          as: 'Recetum',
          include: [
            {
              model: models.MateriaPrima,
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
  } catch (error) {
    console.error('Error al obtener producción:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener producciones por fecha
export const getProduccionesPorFecha = async (req: Request, res: Response) => {
  try {
    const { fecha } = req.params;
    
    // Crear objeto Date con la fecha proporcionada
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    const producciones = await models.Produccion.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [fechaInicio, fechaFin] // Usar Op importado en lugar de sequelize.Op
        }
      },
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.Receta,
          as: 'Recetum',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha_hora', 'ASC']]
    });
    
    // Agrupar por receta
    const produccionesPorReceta = producciones.reduce((acc: any, prod: any) => {
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
  } catch (error) {
    console.error('Error al obtener producciones por fecha:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear una nueva producción
export const createProduccion = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const { recetaId, cantidad } = req.body;
    
    if (!req.usuario) {
      await t.rollback();
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const usuarioId = req.usuario.id;

    console.log('Datos recibidos:', { recetaId, cantidad, usuarioId });

    // Validar datos requeridos
    if (!recetaId || !cantidad || cantidad <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Datos inválidos para la producción' });
    }

    // Buscar la receta con sus ingredientes
    const receta = await models.Receta.findByPk(recetaId, {
      include: [
        {
          model: models.MateriaPrima,
          through: {
            attributes: ['cantidad', 'unidad_medida']
          }
        }
      ]
    });

    if (!receta) {
      await t.rollback();
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Verificar si hay suficientes ingredientes
    const ingredientes = receta.get('MateriaPrimas') as any[];
    const ingredientesFaltantes = [];

    for (const ingrediente of ingredientes) {
      const cantidadNecesariaEnReceta = ingrediente.RecetaIngrediente.cantidad * cantidad;
      const unidadEnReceta = ingrediente.RecetaIngrediente.unidad_medida;
      const unidadEnStock = ingrediente.unidad_medida;
      const cantidadDisponibleEnStock = ingrediente.cantidad_stock;

      // Convertir la cantidad necesaria a la unidad del stock
      let cantidadNecesariaConvertida = cantidadNecesariaEnReceta;
      if (unidadEnReceta !== unidadEnStock) {
        const cantidadConvertida = convertirUnidades(
          cantidadNecesariaEnReceta,
          unidadEnReceta,
          unidadEnStock
        );
        
        if (cantidadConvertida !== null) {
          cantidadNecesariaConvertida = cantidadConvertida;
        } else {
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
      await t.rollback();
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
        const cantidadConvertida = convertirUnidades(
          cantidadNecesariaEnReceta,
          unidadEnReceta,
          unidadEnStock
        );
        
        if (cantidadConvertida !== null) {
          cantidadADescontar = cantidadConvertida;
        } else {
          // Ya hemos verificado arriba que todas las conversiones son posibles
          console.error(`Error inesperado: No se pudo convertir de ${unidadEnReceta} a ${unidadEnStock}`);
          await t.rollback();
          return res.status(500).json({ message: 'Error en la conversión de unidades' });
        }
      }
      
      const nuevoStock = ingrediente.cantidad_stock - cantidadADescontar;

      await models.MateriaPrima.update(
        {
          cantidad_stock: nuevoStock,
          fecha_ultima_actualizacion: new Date()
        },
        {
          where: { id: ingrediente.id },
          transaction: t
        }
      );

      // Registrar el movimiento de inventario
      await models.MovimientoInventario.create(
        {
          MateriaPrimaId: ingrediente.id,
          UsuarioId: usuarioId,
          tipo: 'SALIDA',
          cantidad: cantidadADescontar,
          unidad_medida: unidadEnStock,
          motivo: `Producción de ${cantidad} unidades de ${receta.get('nombre')}`,
          fecha: new Date()
        },
        { transaction: t }
      );
    }

    // Crear el registro de producción
    const produccion = await models.Produccion.create({
      RecetaId: recetaId,
      UsuarioId: usuarioId,
      cantidad,
      fecha_hora: new Date()
    }, { transaction: t });

    console.log('Producción creada:', produccion.toJSON());

    // Obtener la producción con sus relaciones
    const produccionCompleta = await models.Produccion.findByPk(produccion.getDataValue('id'), {
      include: [
        {
          model: models.Usuario,
          attributes: ['id', 'nombre', 'apellido', 'usuario']
        },
        {
          model: models.Receta,
          as: 'Recetum',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      transaction: t
    });

    console.log('Producción completa:', JSON.stringify(produccionCompleta, null, 2));

    await t.commit();
    return res.status(201).json(produccionCompleta);
  } catch (error) {
    await t.rollback();
    console.error('Error al crear producción:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener producciones del día actual
export const getProduccionesDiarias = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const producciones = await models.Produccion.findAll({
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
        },
        {
          model: models.Receta,
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
  } catch (error) {
    console.error('Error al obtener producciones diarias:', error);
    res.status(500).json({ 
      message: 'Error al obtener las producciones diarias',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener producciones de la semana actual
export const getProduccionesSemanales = async (req: Request, res: Response): Promise<void> => {
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

    const producciones = await models.Produccion.findAll({
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
        },
        {
          model: models.Receta,
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
  } catch (error) {
    console.error('Error al obtener producciones semanales:', error);
    res.status(500).json({ 
      message: 'Error al obtener las producciones semanales',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Nuevo endpoint para obtener producciones por rango de fechas
export const getProduccionesPorRango = async (req: Request, res: Response): Promise<void> => {
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

    console.log('Consultando producciones por rango:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const producciones = await models.Produccion.findAll({
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
        },
        {
          model: models.Receta,
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
  } catch (error) {
    console.error('Error al obtener producciones por rango:', error);
    res.status(500).json({ 
      message: 'Error al obtener las producciones por rango',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};