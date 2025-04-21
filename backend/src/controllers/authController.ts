import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import { models } from '../config/init-db';
import { UsuarioInstance } from '../types/models';

// Interfaz para el payload del token
interface TokenPayload {
  id: number;
  usuario: string;
  rol: string;
}

interface JwtPayload {
  id: number;
  usuario: string;
  rol: string;
}

// Login de usuarios
export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, contraseña } = req.body;

    // Validar que se enviaron todos los campos requeridos
    if (!usuario || !contraseña) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar el usuario en la base de datos
    const user = await models.Usuario.findOne({ where: { usuario } });

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const isValidPassword = await bcrypt.compare(contraseña, user.get('contraseña') as string);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Actualizar última conexión
    await user.update({
      ultima_conexion: new Date()
    });

    // Crear el payload del token
    const payload: TokenPayload = {
      id: user.get('id') as number,
      usuario: user.get('usuario') as string,
      rol: user.get('rol') as string
    };

    // Generar el token
    const secretKey: Secret = process.env.JWT_SECRET || 'panaderia_secret_key';
    const token = jwt.sign(payload, secretKey, {
      expiresIn: '24h'
    });

    // Responder con el token y datos del usuario
    return res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.get('id'),
        nombre: user.get('nombre'),
        apellido: user.get('apellido'),
        usuario: user.get('usuario'),
        rol: user.get('rol'),
        ultima_conexion: user.get('ultima_conexion')
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Registro de usuarios (solo para administradores)
export const register = async (req: Request, res: Response) => {
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
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener información del usuario actual
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // El middleware de autenticación ya habrá verificado el token
    // y añadido el usuario al objeto request
    const userId = (req as any).user.id;

    // Buscar el usuario en la base de datos
    const user = await models.Usuario.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Responder con los datos del usuario
    return res.status(200).json({
      user: {
        id: user.get('id'),
        nombre: user.get('nombre'),
        apellido: user.get('apellido'),
        usuario: user.get('usuario'),
        rol: user.get('rol')
      }
    });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

