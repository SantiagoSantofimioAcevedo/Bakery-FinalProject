import { Model } from 'sequelize';

export interface IPasswordReset {
  id?: number;
  usuario: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface PasswordResetModel extends Model {
  id: number;
  usuario: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface UsuarioModel extends Model {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  usuario: string;
  contraseña: string;
  rol: 'panadero' | 'administrador';
  resetToken: string | null;
  resetTokenExpires: Date | null;
  save(): Promise<this>;
} 