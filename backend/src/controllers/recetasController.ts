import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configuración de multer para la carga de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/recetas');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receta-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no válido. Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
};

// Configuración del middleware de multer
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Obtener todas las recetas
export const getAllRecetas = async (req: Request, res: Response) => {
  try {
    const recetas = await models.Receta.findAll({
      include: [
        {
          model: models.MateriaPrima,
          through: {
            attributes: ['cantidad', 'unidad_medida']
          }
        }
      ]
    });
    
    // Agregar URL completa para la imagen o imagen por defecto
    const recetasConImagenes = recetas.map(receta => {
      const recetaObj = receta.toJSON();
      if (recetaObj.imagen) {
        recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`;
      } else {
        recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
      }
      return recetaObj;
    });
    
    return res.status(200).json(recetasConImagenes);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener una receta por ID
export const getRecetaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const receta = await models.Receta.findByPk(id, {
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
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    
    // Agregar URL completa para la imagen o imagen por defecto
    const recetaObj = receta.toJSON();
    if (recetaObj.imagen) {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`;
    } else {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
    }
    
    return res.status(200).json(recetaObj);
  } catch (error) {
    console.error('Error al obtener receta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createReceta = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    
    try {
      const { 
        nombre, 
        descripcion, 
        tiempo_preparacion, 
        tiempo_horneado, 
        temperatura, 
        instrucciones, 
        precio_venta,
        ingredientes 
      } = req.body;
      
      // Validar que se enviaron todos los campos requeridos
      if (!nombre || !tiempo_preparacion || !tiempo_horneado || !temperatura || !instrucciones || !precio_venta || !ingredientes) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
      }
      
      // Validar que el array de ingredientes no esté vacío
      if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
        return res.status(400).json({ message: 'Debe incluir al menos un ingrediente' });
      }
      
      // Obtener el archivo de imagen si existe
      const imagen = req.file ? req.file.filename : null;
      
      // Crear la nueva receta
      const nuevaReceta = await models.Receta.create({
        nombre,
        descripcion: descripcion || '',
        tiempo_preparacion,
        tiempo_horneado,
        temperatura,
        instrucciones,
        precio_venta,
        imagen  // Nuevo campo para guardar el nombre del archivo
      }, { transaction: t });
      
      // Acceder a 'id' de la receta creada de forma segura
      const recetaId = nuevaReceta.get('id') as number;
      
      // Añadir los ingredientes a la receta
      for (const ingrediente of ingredientes) {
        const { id, cantidad, unidad_medida } = ingrediente;
        
        // Verificar que la materia prima existe
        const materiaPrima = await models.MateriaPrima.findByPk(id);
        if (!materiaPrima) {
          await t.rollback();
          return res.status(404).json({ message: `Materia prima con ID ${id} no encontrada` });
        }
        
        // Añadir la relación entre receta e ingrediente
        await models.RecetaIngrediente.create({
          RecetaId: recetaId,          // ✅ Usar 'recetaId' obtenido con .get()
          MateriaPrimaId: id,
          cantidad,
          unidad_medida
        }, { transaction: t });
      }
      
      // Confirmar la transacción
      await t.commit();
      
      // Obtener la receta completa con los ingredientes
      const recetaCompleta = await models.Receta.findByPk(recetaId, {
        include: [
          {
            model: models.MateriaPrima,
            through: {
              attributes: ['cantidad', 'unidad_medida']
            }
          }
        ]
      });
      
      // Verificar que recetaCompleta no sea null
      if (!recetaCompleta) {
        return res.status(500).json({ message: 'Error al recuperar la receta creada' });
      }
      
      // Agregar URL completa para la imagen o imagen por defecto
      const recetaObj = recetaCompleta.toJSON();
      recetaObj.imagen_url = recetaObj.imagen 
        ? `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`
        : `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
      
      return res.status(201).json(recetaObj);
    } catch (error) {
      // Revertir la transacción en caso de error
      await t.rollback();
      console.error('Error al crear receta:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };

// Actualizar una receta existente
export const updateReceta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      tiempo_preparacion, 
      tiempo_horneado, 
      temperatura, 
      instrucciones, 
      precio_venta,
      ingredientes 
    } = req.body;
    
    // Buscar la receta
    const receta = await models.Receta.findByPk(id);
    
    if (!receta) {
      await t.rollback();
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    
    // Obtener el archivo de imagen si existe
    const imagen = req.file ? req.file.filename : receta.get('imagen');
    
    // Si hay una nueva imagen y ya existe una imagen anterior, borrar la imagen anterior
    if (req.file && receta.get('imagen')) {
      const imagenAnterior = receta.get('imagen');
      const rutaImagen = path.join(__dirname, '../../uploads/recetas', imagenAnterior as string);
      
      // Verificar si el archivo existe antes de intentar eliminarlo
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }
    
    // Actualizar la receta
    await receta.update({
      nombre: nombre || receta.get('nombre'),
      descripcion: descripcion !== undefined ? descripcion : receta.get('descripcion'),
      tiempo_preparacion: tiempo_preparacion || receta.get('tiempo_preparacion'),
      tiempo_horneado: tiempo_horneado || receta.get('tiempo_horneado'),
      temperatura: temperatura || receta.get('temperatura'),
      instrucciones: instrucciones || receta.get('instrucciones'),
      precio_venta: precio_venta || receta.get('precio_venta'),
      imagen: imagen  // Actualizar campo de imagen
    }, { transaction: t });
    
    // Si se enviaron ingredientes, actualizar las relaciones
    if (ingredientes && Array.isArray(ingredientes)) {
      // Eliminar las relaciones actuales
      await models.RecetaIngrediente.destroy({
        where: { RecetaId: id },
        transaction: t
      });
      
      // Añadir las nuevas relaciones
      for (const ingrediente of ingredientes) {
        const { id: materiaId, cantidad, unidad_medida } = ingrediente;
        
        // Verificar que la materia prima existe
        const materiaPrima = await models.MateriaPrima.findByPk(materiaId);
        if (!materiaPrima) {
          await t.rollback();
          return res.status(404).json({ message: `Materia prima con ID ${materiaId} no encontrada` });
        }
        
        // Añadir la relación entre receta e ingrediente
        await models.RecetaIngrediente.create({
          RecetaId: id,
          MateriaPrimaId: materiaId,
          cantidad,
          unidad_medida
        }, { transaction: t });
      }
    }
    
    // Confirmar la transacción
    await t.commit();
    
    // Obtener la receta actualizada con los ingredientes
    const recetaActualizada = await models.Receta.findByPk(id, {
      include: [
        {
          model: models.MateriaPrima,
          through: {
            attributes: ['cantidad', 'unidad_medida']
          }
        }
      ]
    });
    
    if (!recetaActualizada) {
      return res.status(500).json({ message: 'Error al recuperar la receta actualizada' });
    }
    
    // Agregar URL completa para la imagen o imagen por defecto
    const recetaObj = recetaActualizada.toJSON();
    if (recetaObj.imagen) {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`;
    } else {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
    }
    
    return res.status(200).json(recetaObj);
  } catch (error) {
    // Revertir la transacción en caso de error
    await t.rollback();
    console.error('Error al actualizar receta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar una receta
export const deleteReceta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Buscar la receta
    const receta = await models.Receta.findByPk(id);
    
    if (!receta) {
      await t.rollback();
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    
    // Verificar si la receta ha sido utilizada en producciones o ventas
    const producciones = await models.Produccion.findOne({
      where: { RecetaId: id }
    });
    
    const ventas = await models.DetalleVenta.findOne({
      where: { RecetaId: id }
    });
    
    if (producciones || ventas) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'No se puede eliminar esta receta porque ha sido utilizada en producciones o ventas' 
      });
    }
    
    // Eliminar la imagen si existe
    if (receta.get('imagen')) {
      const rutaImagen = path.join(__dirname, '../../uploads/recetas', receta.get('imagen') as string);
      
      // Verificar si el archivo existe antes de intentar eliminarlo
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }
    
    // Eliminar las relaciones con los ingredientes
    await models.RecetaIngrediente.destroy({
      where: { RecetaId: id },
      transaction: t
    });
    
    // Eliminar la receta
    await receta.destroy({ transaction: t });
    
    // Confirmar la transacción
    await t.commit();
    
    return res.status(200).json({ message: 'Receta eliminada correctamente' });
  } catch (error) {
    // Revertir la transacción en caso de error
    await t.rollback();
    console.error('Error al eliminar receta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Preparar una receta (producción)
export const prepararReceta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const usuarioId = (req as any).user.id; // Obtenido del middleware de autenticación
    
    // Validar que se envió la cantidad
    if (!cantidad || cantidad <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Debe especificar una cantidad válida' });
    }
    
    // Buscar la receta con sus ingredientes
    const receta = await models.Receta.findByPk(id, {
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
    
    // Verificar si hay suficientes ingredientes en stock
    const ingredientes = receta.get('MateriaPrimas') as any[];
    const ingredientesFaltantes = [];
    
    for (const ingrediente of ingredientes) {
      const cantidadNecesaria = ingrediente.RecetaIngrediente.cantidad * cantidad;
      const cantidadDisponible = ingrediente.cantidad_stock;
      
      if (cantidadDisponible < cantidadNecesaria) {
        ingredientesFaltantes.push({
          nombre: ingrediente.nombre,
          cantidadNecesaria,
          cantidadDisponible,
          unidad: ingrediente.RecetaIngrediente.unidad_medida
        });
      }
    }
    
    if (ingredientesFaltantes.length > 0) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'No hay suficientes ingredientes para preparar esta receta',
        ingredientesFaltantes
      });
    }
    
    // Descontar los ingredientes del stock
    for (const ingrediente of ingredientes) {
      const cantidadNecesaria = ingrediente.RecetaIngrediente.cantidad * cantidad;
      const nuevoStock = ingrediente.cantidad_stock - cantidadNecesaria;
      
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
    }
    
    // Registrar la producción
    const produccion = await models.Produccion.create({
      RecetaId: id,
      cantidad,
      UsuarioId: usuarioId,
      fecha_hora: new Date()
    }, { transaction: t });
    
    // Confirmar la transacción
    await t.commit();
    
    return res.status(200).json({
      message: 'Receta preparada correctamente',
      produccion
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await t.rollback();
    console.error('Error al preparar receta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};



