import { Request, Response } from 'express';
import { models } from '../config/init-db';
import bcrypt from 'bcrypt';

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

    res.status(200).json({
      message: 'Miembros del equipo obtenidos exitosamente',
      teamMembers: serializedMembers
    });
  } catch (error) {
    console.error('Error al obtener miembros del equipo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
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
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    await user.update({
      nombre,
      apellido,
      rol
    });

    res.status(200).json({
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
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar un miembro del equipo
export const deleteTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await models.Usuario.findByPk(id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    await user.destroy();
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Función para validar la seguridad de una contraseña
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  // Verificar si la contraseña es una secuencia numérica simple
  if (/^(0123|1234|2345|3456|4567|5678|6789|0987|9876|8765|7654|6543|5432|4321|3210)/.test(password)) {
    return 'La contraseña no puede ser una secuencia numérica simple';
  }
  
  // Verificar si la contraseña es demasiado común
  const commonPasswords = ['password', 'contraseña', '12345678', 'qwerty', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'La contraseña es demasiado común, elige una más segura';
  }
  
  // Verificar si contiene al menos un número y una letra
  if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return 'La contraseña debe contener al menos un número y una letra';
  }
  
  return null; // La contraseña es válida
};

// Crear un nuevo usuario (solo accesible por administradores)
export const createTeamMember = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, documento, usuario, contraseña, rol } = req.body;

    // Validar que se enviaron todos los campos requeridos
    if (!nombre || !apellido || !documento || !usuario || !contraseña || !rol) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar que el rol sea válido
    if (rol !== 'panadero' && rol !== 'administrador') {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Validar la seguridad de la contraseña
    const passwordError = validatePassword(contraseña);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Verificar si el usuario ya existe
    const existingUser = await models.Usuario.findOne({ where: { usuario } });
    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    // Verificar si el documento ya existe
    const existingDocument = await models.Usuario.findOne({ where: { documento } });
    if (existingDocument) {
      return res.status(400).json({ message: 'El documento ya está registrado' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // Crear el nuevo usuario
    const newUser = await models.Usuario.create({
      nombre,
      apellido,
      documento,
      usuario,
      contraseña: hashedPassword,
      rol
    });

    // Responder con los datos del usuario creado (sin la contraseña)
    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.get('id'),
        nombre: newUser.get('nombre'),
        apellido: newUser.get('apellido'),
        documento: newUser.get('documento'),
        usuario: newUser.get('usuario'),
        rol: newUser.get('rol')
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}; 