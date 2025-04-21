import { Request } from 'express';

export interface UserPayload {
  id: number;
  nombre: string;
  apellido: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UserPayload;
    }
  }
} 