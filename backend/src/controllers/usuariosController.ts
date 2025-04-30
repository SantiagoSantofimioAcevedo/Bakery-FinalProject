import { Request, Response } from 'express';
import { models } from '../config/init-db';
import bcrypt from 'bcrypt';

// Obtener todos los usuarios
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await models.Usuario.findAll({
      attributes: { exclude: ['contraseña'] }
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await models.Usuario.findByPk(id, {
      attributes: { exclude: ['contraseña'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar un usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, documento, usuario, contraseña, rol } = req.body;
    
    // Verificar si el usuario existe
    const user = await models.Usuario.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Preparar datos para actualizar
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;
    if (documento) updateData.documento = documento;
    if (usuario) {
      // Verificar si el nuevo nombre de usuario ya existe
      if (usuario !== user.get('usuario')) {
        const existingUser = await models.Usuario.findOne({ where: { usuario } });
        if (existingUser) {
          return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }
      }
      updateData.usuario = usuario;
    }
    if (rol) updateData.rol = rol;
    
    // Si se proporciona una nueva contraseña, hashearla
    if (contraseña) {
      const salt = await bcrypt.genSalt(10);
      updateData.contraseña = await bcrypt.hash(contraseña, salt);
    }
    
    // Actualizar el usuario
    await user.update(updateData);
    
    // Devolver usuario actualizado sin la contraseña
    const updatedUser = await models.Usuario.findByPk(id, {
      attributes: { exclude: ['contraseña'] }
    });
    
    return res.status(200).json({
      message: 'Usuario actualizado correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar un usuario
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar si el usuario existe
    const user = await models.Usuario.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Evitar eliminar el último administrador
    if (user.get('rol') === 'administrador') {
      const adminCount = await models.Usuario.count({
        where: { rol: 'administrador' }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'No se puede eliminar el último administrador del sistema' 
        });
      }
    }
    
    // Eliminar el usuario
    await user.destroy();
    
    return res.status(200).json({ 
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}; 