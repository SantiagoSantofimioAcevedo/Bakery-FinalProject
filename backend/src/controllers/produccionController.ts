import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize, { Op } from '../config/database'; // Importar Op directamente

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
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });
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
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha_hora', 'ASC']]
    });
    
    // Agrupar por receta
    const produccionesPorReceta = producciones.reduce((acc: any, prod: any) => {
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
  } catch (error) {
    console.error('Error al obtener producciones por fecha:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};