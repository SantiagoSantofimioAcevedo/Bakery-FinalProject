import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;  // Agrega return para evitar continuar la ejecución
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'panaderia_secret_key');
    (req as any).user = decoded;
    next();  // Continua con la siguiente función
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
    return;  // Agrega return para evitar continuar la ejecución
  }
};




