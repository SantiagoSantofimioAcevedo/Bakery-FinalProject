import { Request, Response } from 'express';
import { models } from '../config/init-db';

// Obtener todas las materias primas
export const getAllMateriasPrimas = async (req: Request, res: Response) => {
  try {
    const materiasPrimas = await models.MateriaPrima.findAll();
    return res.status(200).json(materiasPrimas);
  } catch (error) {
    console.error('Error al obtener materias primas:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener una materia prima por ID
export const getMateriaPrimaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const materiaPrima = await models.MateriaPrima.findByPk(id);
    
    if (!materiaPrima) {
      return res.status(404).json({ message: 'Materia prima no encontrada' });
    }
    
    return res.status(200).json(materiaPrima);
  } catch (error) {
    console.error('Error al obtener materia prima:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear una nueva materia prima
export const createMateriaPrima = async (req: Request, res: Response) => {
  try {
    const { nombre, unidad_medida, cantidad_stock, costo_unitario, umbral_minimo } = req.body;
    
    // Validar que se enviaron todos los campos requeridos
    if (!nombre || !unidad_medida || costo_unitario === undefined || umbral_minimo === undefined) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    // Validar que los valores numéricos sean positivos
    if (cantidad_stock < 0 || costo_unitario < 0 || umbral_minimo < 0) {
      return res.status(400).json({ message: 'Los valores numéricos deben ser positivos' });
    }
    
    // Crear la nueva materia prima
    const nuevaMateriaPrima = await models.MateriaPrima.create({
      nombre,
      unidad_medida,
      cantidad_stock: cantidad_stock || 0,
      costo_unitario,
      umbral_minimo,
      fecha_ultima_actualizacion: new Date()
    });
    
    return res.status(201).json(nuevaMateriaPrima);
  } catch (error) {
    console.error('Error al crear materia prima:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar una materia prima existente
export const updateMateriaPrima = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, unidad_medida, cantidad_stock, costo_unitario, umbral_minimo } = req.body;
    
    // Buscar la materia prima
    const materiaPrima = await models.MateriaPrima.findByPk(id);
    
    if (!materiaPrima) {
      return res.status(404).json({ message: 'Materia prima no encontrada' });
    }
    
    // Validar que los valores numéricos sean positivos si están definidos
    if ((cantidad_stock !== undefined && cantidad_stock < 0) || 
        (costo_unitario !== undefined && costo_unitario < 0) || 
        (umbral_minimo !== undefined && umbral_minimo < 0)) {
      return res.status(400).json({ message: 'Los valores numéricos deben ser positivos' });
    }
    
    // Actualizar la materia prima
    await materiaPrima.update({
      nombre: nombre || materiaPrima.get('nombre'),
      unidad_medida: unidad_medida || materiaPrima.get('unidad_medida'),
      cantidad_stock: cantidad_stock !== undefined ? cantidad_stock : materiaPrima.get('cantidad_stock'),
      costo_unitario: costo_unitario !== undefined ? costo_unitario : materiaPrima.get('costo_unitario'),
      umbral_minimo: umbral_minimo !== undefined ? umbral_minimo : materiaPrima.get('umbral_minimo'),
      fecha_ultima_actualizacion: new Date()
    });
    
    return res.status(200).json(materiaPrima);
  } catch (error) {
    console.error('Error al actualizar materia prima:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar una materia prima
export const deleteMateriaPrima = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Buscar la materia prima
    const materiaPrima = await models.MateriaPrima.findByPk(id);
    
    if (!materiaPrima) {
      return res.status(404).json({ message: 'Materia prima no encontrada' });
    }
    
    // Verificar si la materia prima está siendo utilizada en alguna receta
    const recetaIngredientes = await models.RecetaIngrediente.findOne({
      where: { MateriaPrimaId: id }
    });
    
    if (recetaIngredientes) {
      return res.status(400).json({ 
        message: 'No se puede eliminar esta materia prima porque está siendo utilizada en una o más recetas' 
      });
    }
    
    // Eliminar la materia prima
    await materiaPrima.destroy();
    
    return res.status(200).json({ message: 'Materia prima eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar materia prima:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Ajustar el stock de una materia prima
export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;
    
    // Validar que se enviaron todos los campos requeridos
    if (cantidad === undefined || !motivo) {
      return res.status(400).json({ message: 'Cantidad y motivo son requeridos' });
    }
    
    // Buscar la materia prima
    const materiaPrima = await models.MateriaPrima.findByPk(id);
    
    if (!materiaPrima) {
      return res.status(404).json({ message: 'Materia prima no encontrada' });
    }
    
    // Calcular nuevo stock
    const stockActual = materiaPrima.get('cantidad_stock') as number;
    const nuevoStock = stockActual + cantidad;
    
    // Validar que el nuevo stock no sea negativo
    if (nuevoStock < 0) {
      return res.status(400).json({ message: 'El stock no puede ser negativo' });
    }
    
    // Actualizar el stock
    await materiaPrima.update({
      cantidad_stock: nuevoStock,
      fecha_ultima_actualizacion: new Date()
    });
    
    // Aquí podrías registrar el movimiento en una tabla de historial si lo deseas
    
    return res.status(200).json({
      message: 'Stock ajustado correctamente',
      materiaPrima
    });
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener materias primas con stock bajo
export const getLowStock = async (req: Request, res: Response) => {
  try {
    // Obtener todas las materias primas
    const materiasPrimas = await models.MateriaPrima.findAll();
    
    // Filtrar las que tienen stock bajo
    const lowStock = materiasPrimas.filter(item => {
      const stock = item.get('cantidad_stock') as number;
      const umbral = item.get('umbral_minimo') as number;
      return stock <= umbral;
    });
    
    return res.status(200).json(lowStock);
  } catch (error) {
    console.error('Error al obtener materias primas con stock bajo:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};