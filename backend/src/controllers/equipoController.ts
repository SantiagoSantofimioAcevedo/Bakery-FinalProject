import { Request, Response } from 'express';
import { models } from '../config/init-db';
import { Op } from 'sequelize';

// Obtener todos los miembros del equipo
export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const teamMembers = await models.Usuario.findAll({
      attributes: ['id', 'nombre', 'apellido', 'usuario', 'rol', 'ultima_conexion'],
      order: [['nombre', 'ASC']]
    });

    const serializedMembers = teamMembers.map(member => {
      const ultima_conexion = member.get('ultima_conexion') as Date | null;
      console.log(`Usuario ${member.get('usuario')} - última conexión:`, ultima_conexion);
      
      return {
        id: member.get('id'),
        nombre: member.get('nombre'),
        apellido: member.get('apellido'),
        usuario: member.get('usuario'),
        rol: member.get('rol'),
        ultima_conexion: ultima_conexion instanceof Date ? ultima_conexion.toISOString() : null
      };
    });

    console.log('Miembros serializados:', serializedMembers);

    return res.status(200).json({
      message: 'Miembros del equipo obtenidos exitosamente',
      teamMembers: serializedMembers
    });
  } catch (error) {
    console.error('Error al obtener miembros del equipo:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener un usuario específico
export const getTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await models.Usuario.findByPk(id, {
      attributes: ['id', 'nombre', 'apellido', 'documento', 'usuario', 'rol', 'ultima_conexion', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const ultima_conexion = user.get('ultima_conexion') as Date | null;

    const serializedUser = {
      id: user.get('id'),
      nombre: user.get('nombre'),
      apellido: user.get('apellido'),
      documento: user.get('documento'),
      usuario: user.get('usuario'),
      rol: user.get('rol'),
      ultima_conexion: ultima_conexion instanceof Date ? ultima_conexion.toISOString() : null,
      createdAt: user.get('createdAt'),
      updatedAt: user.get('updatedAt')
    };

    return res.status(200).json(serializedUser);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// Actualizar un miembro del equipo
export const updateTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, rol } = req.body;

    const user = await models.Usuario.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.update({
      nombre,
      apellido,
      rol
    });

    return res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: user.get('id'),
        nombre: user.get('nombre'),
        apellido: user.get('apellido'),
        usuario: user.get('usuario'),
        rol: user.get('rol')
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar un miembro del equipo
export const deleteTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await models.Usuario.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.destroy();
    return res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}; 