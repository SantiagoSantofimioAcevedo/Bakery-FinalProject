import { Request, Response } from 'express';
import { models } from '../config/init-db';
import { IngresoMateriaPrimaInstance, MateriaPrimaInstance } from '../types/models';
import { Op } from 'sequelize';

// Extender la interfaz Request para incluir el usuario
interface RequestWithUser extends Request {
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

// Registrar un nuevo ingreso
export const registrarIngreso = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { materia_prima_id, cantidad, costo_unitario, costo_total, unidad_medida, proveedor, numero_factura, observaciones } = req.body;

    // Validar datos requeridos
    if (!materia_prima_id || !cantidad || (!costo_unitario && !costo_total) || !unidad_medida || !proveedor) {
      res.status(400).json({ message: 'Faltan datos requeridos' });
      return;
    }

    if (!req.usuario) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // Verificar que la materia prima existe
    const materiaPrima = await models.MateriaPrima.findByPk(materia_prima_id) as MateriaPrimaInstance | null;
    if (!materiaPrima) {
      res.status(404).json({ message: 'Materia prima no encontrada' });
      return;
    }

    // Calcular el costo_unitario y costo_total según los datos recibidos
    let calculatedCostoUnitario = costo_unitario;
    let calculatedCostoTotal = costo_total;

    // Si se proporcionó costo_total, calcular costo_unitario
    if (costo_total && !costo_unitario) {
      calculatedCostoUnitario = costo_total / cantidad;
    } 
    // Si se proporcionó costo_unitario, calcular costo_total
    else if (costo_unitario && !costo_total) {
      calculatedCostoTotal = cantidad * costo_unitario;
    }

    // Crear el registro de ingreso
    const ingreso = await models.IngresoMateriaPrima.create({
      MateriaPrimaId: materia_prima_id,
      UsuarioId: req.usuario.id,
      cantidad,
      costo_unitario: calculatedCostoUnitario,
      costo_total: calculatedCostoTotal,
      unidad_medida,
      proveedor,
      fecha_ingreso: new Date(),
      numero_factura,
      observaciones
    }) as IngresoMateriaPrimaInstance;

    // Actualizar SOLO el stock de la materia prima, no el costo unitario
    await materiaPrima.update({
      cantidad_stock: materiaPrima.cantidad_stock + cantidad
      // Ya no actualizamos el costo_unitario
    });

    // Obtener el ingreso completo con la información de la materia prima y usuario
    const ingresoCompleto = await models.IngresoMateriaPrima.findByPk(ingreso.get('id'), {
      include: [
        {
          model: models.MateriaPrima,
          as: 'MateriaPrima',
          attributes: ['id', 'nombre', 'cantidad_stock', 'unidad_medida']
        },
        {
          model: models.Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido', 'rol']
        }
      ]
    }) as IngresoMateriaPrimaInstance | null;

    res.status(201).json(ingresoCompleto);
  } catch (error) {
    console.error('Error al registrar ingreso:', error);
    res.status(500).json({
      message: 'Error al registrar el ingreso',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener historial de ingresos por materia prima
export const obtenerHistorialIngresos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materia_prima_id } = req.params;
    
    if (!materia_prima_id) {
      res.status(400).json({ message: 'Se requiere el ID de la materia prima' });
      return;
    }

    const { fechaInicio, fechaFin } = req.query;
    const where: any = { MateriaPrimaId: parseInt(materia_prima_id) };

    if (fechaInicio && fechaFin) {
      where.fecha_ingreso = {
        [Op.between]: [new Date(fechaInicio as string), new Date(fechaFin as string)]
      };
    }

    const ingresos = await models.IngresoMateriaPrima.findAll({
      where,
      include: [{
        model: models.MateriaPrima,
        as: 'MateriaPrima'
      }],
      order: [['fecha_ingreso', 'DESC']]
    }) as IngresoMateriaPrimaInstance[];

    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener historial de ingresos:', error);
    res.status(500).json({ 
      message: 'Error al obtener el historial de ingresos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener todos los ingresos con filtros
export const obtenerTodosLosIngresos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fechaInicio, fechaFin, materia_prima_id } = req.query;
    const where: any = {};

    if (fechaInicio && fechaFin) {
      where.fecha_ingreso = {
        [Op.between]: [new Date(fechaInicio as string), new Date(fechaFin as string)]
      };
    }

    if (materia_prima_id) {
      where.MateriaPrimaId = parseInt(materia_prima_id as string);
    }

    const ingresos = await models.IngresoMateriaPrima.findAll({
      where,
      attributes: [
        'id',
        'MateriaPrimaId',
        'UsuarioId',
        'fecha_ingreso',
        'cantidad',
        'unidad_medida',
        'costo_unitario',
        'costo_total',
        'proveedor',
        'numero_factura',
        'observaciones',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: models.MateriaPrima,
          as: 'MateriaPrima',
          attributes: ['id', 'nombre']
        },
        {
          model: models.Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [['fecha_ingreso', 'DESC']]
    }) as IngresoMateriaPrimaInstance[];

    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener todos los ingresos:', error);
    res.status(500).json({ 
      message: 'Error al obtener los ingresos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Editar un ingreso existente
export const editarIngreso = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { materia_prima_id, cantidad, costo_unitario, costo_total, unidad_medida, proveedor, numero_factura, observaciones } = req.body;

    if (!req.usuario) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // Buscar el ingreso a editar
    const ingreso = await models.IngresoMateriaPrima.findByPk(id) as IngresoMateriaPrimaInstance | null;
    if (!ingreso) {
      res.status(404).json({ message: 'Ingreso no encontrado' });
      return;
    }

    // Buscar la materia prima actual
    const materiaPrimaActual = await models.MateriaPrima.findByPk(ingreso.MateriaPrimaId) as MateriaPrimaInstance | null;
    if (!materiaPrimaActual) {
      res.status(404).json({ message: 'Materia prima actual no encontrada' });
      return;
    }

    // Revertir el ingreso anterior en el stock
    await materiaPrimaActual.update({
      cantidad_stock: materiaPrimaActual.cantidad_stock - ingreso.cantidad
    });

    // Obtener la materia prima para el nuevo ingreso (puede ser la misma u otra)
    const materiaPrimaNueva = await models.MateriaPrima.findByPk(materia_prima_id || ingreso.MateriaPrimaId) as MateriaPrimaInstance | null;
    if (!materiaPrimaNueva) {
      res.status(404).json({ message: 'Materia prima nueva no encontrada' });
      return;
    }

    // Determinar la cantidad actualizada
    const cantidadActualizada = cantidad !== undefined ? cantidad : ingreso.cantidad;
    
    // Calcular el costo_unitario y costo_total según los datos recibidos
    let calculatedCostoUnitario = costo_unitario !== undefined ? costo_unitario : ingreso.costo_unitario;
    let calculatedCostoTotal = costo_total !== undefined ? costo_total : ingreso.costo_total;

    // Si se proporcionó costo_total, recalcular costo_unitario
    if (costo_total !== undefined && cantidadActualizada > 0) {
      calculatedCostoUnitario = costo_total / cantidadActualizada;
    } 
    // Si se proporcionó costo_unitario o se cambió la cantidad, recalcular costo_total
    else if ((costo_unitario !== undefined || cantidad !== undefined) && costo_total === undefined) {
      calculatedCostoTotal = cantidadActualizada * calculatedCostoUnitario;
    }

    // Actualizar el ingreso
    await ingreso.update({
      MateriaPrimaId: materia_prima_id || ingreso.MateriaPrimaId,
      cantidad: cantidadActualizada,
      costo_unitario: calculatedCostoUnitario,
      costo_total: calculatedCostoTotal,
      unidad_medida: unidad_medida || ingreso.unidad_medida,
      proveedor: proveedor || ingreso.proveedor,
      numero_factura: numero_factura || ingreso.numero_factura,
      observaciones: observaciones !== undefined ? observaciones : ingreso.observaciones
    });

    // Actualizar SOLO el stock de la materia prima, no el costo unitario
    await materiaPrimaNueva.update({
      cantidad_stock: materiaPrimaNueva.cantidad_stock + cantidadActualizada
      // Ya no actualizamos el costo_unitario
    });

    // Obtener el ingreso actualizado con las relaciones
    const ingresoActualizado = await models.IngresoMateriaPrima.findByPk(id, {
      include: [
        {
          model: models.MateriaPrima,
          as: 'MateriaPrima',
          attributes: ['id', 'nombre', 'cantidad_stock', 'unidad_medida']
        },
        {
          model: models.Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido', 'rol']
        }
      ]
    }) as IngresoMateriaPrimaInstance | null;

    res.json(ingresoActualizado);
  } catch (error) {
    console.error('Error al editar ingreso:', error);
    res.status(500).json({ 
      message: 'Error al editar el ingreso',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Eliminar un ingreso
export const eliminarIngreso = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.usuario) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // Buscar el ingreso a eliminar
    const ingreso = await models.IngresoMateriaPrima.findByPk(id) as IngresoMateriaPrimaInstance | null;
    if (!ingreso) {
      res.status(404).json({ message: 'Ingreso no encontrado' });
      return;
    }

    // Buscar la materia prima
    const materiaPrima = await models.MateriaPrima.findByPk(ingreso.MateriaPrimaId) as MateriaPrimaInstance | null;
    if (!materiaPrima) {
      res.status(404).json({ message: 'Materia prima no encontrada' });
      return;
    }

    // Actualizar el stock de la materia prima (restar lo que se ingresó)
    await materiaPrima.update({
      cantidad_stock: Math.max(0, materiaPrima.cantidad_stock - ingreso.cantidad)
    });

    // Eliminar el ingreso
    await ingreso.destroy();

    res.json({ message: 'Ingreso eliminado correctamente', eliminado: true });
  } catch (error) {
    console.error('Error al eliminar ingreso:', error);
    res.status(500).json({ 
      message: 'Error al eliminar el ingreso',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 