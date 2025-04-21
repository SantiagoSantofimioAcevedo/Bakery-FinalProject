import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { models } from '../config/init-db';
import { UsuarioInstance } from '../types/models';
import { UserPayload } from '../types/auth';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No se proporcionó token de autenticación' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt') as jwt.JwtPayload;
    
    // Buscar el usuario en la base de datos
    const usuario = await models.Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    const usuarioData = usuario.get({ plain: true }) as UsuarioInstance;

    // Agregar el usuario al objeto request
    req.usuario = {
      id: usuarioData.id,
      nombre: usuarioData.nombre,
      apellido: usuarioData.apellido,
      rol: usuarioData.rol
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ message: 'Token inválido o expirado' });
    return;
  }
};




