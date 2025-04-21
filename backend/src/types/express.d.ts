import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        nombre: string;
        apellido: string;
        rol: string;
      };
    }
  }
} 