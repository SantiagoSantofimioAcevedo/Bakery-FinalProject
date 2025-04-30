import { Request, Response } from 'express';
import { models } from '../config/init-db';
import sequelize from '../config/database';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getProductoDisponible } from './ventasController';
import { convertirUnidades } from '../utils/unitConversion';

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

// Interfaz para el modelo Receta
interface RecetaAttributes {
  id?: number;
  nombre: string;
  descripcion?: string;
  tiempo_preparacion: number;
  tiempo_horneado: number;
  temperatura: number;
  instrucciones: string;
  precio_venta: number;
  imagen?: string;
}

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
    
    console.log('⭐ Obteniendo receta con ID:', id);
    
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
      console.log('❌ Receta no encontrada');
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    
    // Agregar URL completa para la imagen o imagen por defecto
    const recetaObj = receta.toJSON();
    console.log('📦 Datos de la receta:', JSON.stringify(recetaObj, null, 2));
    
    if (recetaObj.imagen) {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`;
    } else {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
    }
    
    console.log('🔍 MateriaPrima en la receta:', recetaObj.MateriaPrima);
    
    return res.status(200).json(recetaObj);
  } catch (error) {
    console.error('Error al obtener receta:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createReceta = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    
    try {
      let recetaData;
      
      // Si hay un archivo, los datos de la receta vienen en el campo 'receta' como string
      if (req.file) {
        try {
          recetaData = JSON.parse(req.body.receta);
          console.log('📥 Datos recibidos para crear receta (con imagen):', JSON.stringify(recetaData, null, 2));
        } catch (error) {
          console.error('❌ Error al procesar los datos de la receta:', error);
          return res.status(400).json({ message: 'Error al procesar los datos de la receta' });
        }
      } else {
        // Si no hay archivo, los datos vienen directamente en req.body
        recetaData = req.body;
        console.log('📥 Datos recibidos para crear receta (sin imagen):', JSON.stringify(recetaData, null, 2));
      }

      const { 
        nombre, 
        descripcion, 
        tiempo_preparacion, 
        tiempo_horneado, 
        temperatura, 
        instrucciones, 
        precio_venta,
        ingredientes 
      } = recetaData;
      
      console.log('🧾 Ingredientes recibidos:', JSON.stringify(ingredientes, null, 2));
      
      // Validar que se enviaron todos los campos requeridos
      if (!nombre || !tiempo_preparacion || !tiempo_horneado || !temperatura || !instrucciones || !precio_venta || !ingredientes) {
        console.log('❌ Faltan campos requeridos');
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
      }
      
      // Validar que el array de ingredientes no esté vacío
      if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
        console.log('❌ No se recibieron ingredientes');
        return res.status(400).json({ message: 'Debe incluir al menos un ingrediente' });
      }
      
      // Obtener el archivo de imagen si existe
      const imagen = req.file ? req.file.filename : null;
      console.log('🖼️ Imagen:', imagen ? `Archivo: ${imagen}` : 'No se proporcionó imagen');
      
      // Crear la nueva receta
      const nuevaReceta = await models.Receta.create({
        nombre,
        descripcion: descripcion || '',
        tiempo_preparacion,
        tiempo_horneado,
        temperatura,
        instrucciones,
        precio_venta,
        imagen
      }, { transaction: t });
      
      console.log('✅ Receta base creada:', nuevaReceta.get('id'));
      
      // Acceder a 'id' de la receta creada de forma segura
      const recetaId = nuevaReceta.get('id') as number;
      
      // Añadir los ingredientes a la receta
      for (const ingrediente of ingredientes) {
        const { id, cantidad, unidad_medida } = ingrediente;
        console.log(`📝 Agregando ingrediente: ID=${id}, Cantidad=${cantidad}, Unidad=${unidad_medida}`);
        
        // Verificar que la materia prima existe
        const materiaPrima = await models.MateriaPrima.findByPk(id);
        if (!materiaPrima) {
          await t.rollback();
          console.log(`❌ Materia prima no encontrada: ${id}`);
          return res.status(404).json({ message: `Materia prima con ID ${id} no encontrada` });
        }
        
        // Añadir la relación entre receta e ingrediente
        await models.RecetaIngrediente.create({
          RecetaId: recetaId,
          MateriaPrimaId: id,
          cantidad,
          unidad_medida
        }, { transaction: t });
      }
      
      // Confirmar la transacción
      await t.commit();
      console.log('✅ Transacción confirmada');
      
      // Obtener la receta completa con los ingredientes
      console.log(`🔄 Obteniendo receta completa con ID: ${recetaId}`);
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
        console.error('❌ No se pudo recuperar la receta creada');
        return res.status(500).json({ message: 'Error al recuperar la receta creada' });
      }
      
      console.log('✅ Receta completa recuperada:', JSON.stringify(recetaCompleta.toJSON(), null, 2));
      
      // Agregar URL completa para la imagen o imagen por defecto
      const recetaObj = recetaCompleta.toJSON();
      recetaObj.imagen_url = recetaObj.imagen 
        ? `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`
        : `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
      
      return res.status(201).json(recetaObj);
    } catch (error) {
      // Revertir la transacción en caso de error
      await t.rollback();
      console.error('❌ Error al crear receta:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };

// Actualizar una receta existente
export const updateReceta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    let recetaData;

    // Si hay un archivo, los datos de la receta vienen en el campo 'receta' como string
    if (req.file) {
      try {
        recetaData = JSON.parse(req.body.receta);
      } catch (error) {
        return res.status(400).json({ message: 'Error al procesar los datos de la receta' });
      }
    } else {
      // Si no hay archivo, los datos vienen directamente en req.body
      recetaData = req.body;
    }

    const { 
      nombre, 
      descripcion, 
      tiempo_preparacion, 
      tiempo_horneado, 
      temperatura, 
      instrucciones, 
      precio_venta,
      ingredientes 
    } = recetaData;

    // Validar que se enviaron todos los campos requeridos
    if (!nombre || !tiempo_preparacion || !tiempo_horneado || !temperatura || !instrucciones || !precio_venta || !ingredientes) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar que el array de ingredientes no esté vacío
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un ingrediente' });
    }

    // Verificar que la receta existe
    const receta = await models.Receta.findByPk(id);
    if (!receta) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Actualizar los datos básicos de la receta
    await receta.update({
      nombre,
      descripcion: descripcion || '',
      tiempo_preparacion,
      tiempo_horneado,
      temperatura,
      instrucciones,
      precio_venta,
      imagen: req.file ? req.file.filename : receta.get('imagen')
    }, { transaction: t });

    // Eliminar los ingredientes actuales
    await models.RecetaIngrediente.destroy({
      where: { RecetaId: id },
      transaction: t
    });

    // Añadir los nuevos ingredientes
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

    // Obtener la receta actualizada con sus ingredientes
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
      await t.rollback();
      return res.status(500).json({ message: 'Error al recuperar la receta actualizada' });
    }

    // Agregar URL de la imagen
    const recetaObj = recetaActualizada.toJSON();
    if (recetaObj.imagen) {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/uploads/recetas/${recetaObj.imagen}`;
    } else {
      recetaObj.imagen_url = `${req.protocol}://${req.get('host')}/images/default-recipe.png`;
    }

    // Confirmar la transacción
    await t.commit();

    return res.status(200).json(recetaObj);
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar receta:', error);
    return res.status(500).json({ message: 'Error al actualizar la receta' });
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
      where: { RecetumId: id }
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

// Verificar inventario para una receta
export const checkInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.query;
    const cantidadNum = parseInt(cantidad as string);

    if (!cantidadNum || cantidadNum <= 0) {
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
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Verificar si hay suficientes ingredientes en stock
    const ingredientes = receta.get('MateriaPrimas') as any[];
    const ingredientesFaltantes = [];

    for (const ingrediente of ingredientes) {
      const cantidadNecesariaEnReceta = ingrediente.RecetaIngrediente.cantidad * cantidadNum;
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
            cantidad_requerida: cantidadNecesariaEnReceta,
            cantidad_disponible: cantidadDisponibleEnStock,
            unidad_medida_receta: unidadEnReceta,
            unidad_medida_stock: unidadEnStock,
            mensaje: `No se pudo convertir de ${unidadEnReceta} a ${unidadEnStock}`
          });
          continue;
        }
      }

      if (cantidadDisponibleEnStock < cantidadNecesariaConvertida) {
        ingredientesFaltantes.push({
          nombre: ingrediente.nombre,
          cantidad_requerida: cantidadNecesariaEnReceta,
          cantidad_disponible: cantidadDisponibleEnStock,
          unidad_medida_receta: unidadEnReceta,
          unidad_medida_stock: unidadEnStock,
          cantidad_convertida: cantidadNecesariaConvertida
        });
      }
    }

    return res.status(200).json({
      sufficient: ingredientesFaltantes.length === 0,
      missingIngredients: ingredientesFaltantes
    });
  } catch (error) {
    console.error('Error al verificar inventario:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener disponibilidad de una receta
export const getDisponibilidadReceta = async (req: Request, res: Response) => {
  const recetaId = parseInt(req.params.id);
  
  if (isNaN(recetaId)) {
    return res.status(400).json({ message: 'ID de receta inválido' });
  }
  
  try {
    const disponibilidad = await getProductoDisponible(recetaId);
    return res.status(200).json(disponibilidad);
  } catch (error) {
    console.error(`Error al obtener disponibilidad de receta ${recetaId}:`, error);
    return res.status(500).json({ 
      message: 'Error al obtener disponibilidad',
      details: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
};



