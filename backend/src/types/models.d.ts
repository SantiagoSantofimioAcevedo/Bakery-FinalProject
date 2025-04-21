import { Model } from 'sequelize';

export interface UsuarioAttributes {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  usuario: string;
  contraseña: string;
  rol: 'panadero' | 'administrador';
  ultima_conexion?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UsuarioInstance extends Model<UsuarioAttributes>, UsuarioAttributes {
  get(key: keyof UsuarioAttributes): string | number | Date | null;
}

export interface MateriaPrimaAttributes {
  id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_stock: number;
  costo_unitario: number;
  umbral_minimo: number;
  fecha_ultima_actualizacion: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MateriaPrimaInstance extends Model<MateriaPrimaAttributes>, MateriaPrimaAttributes {}

export interface IngresoMateriaPrimaAttributes {
  id: number;
  MateriaPrimaId: number;
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
  fecha_ingreso: Date;
  UsuarioId: number;
  unidad_medida: string;
  proveedor: string;
  numero_factura?: string;
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IngresoMateriaPrimaInstance extends Model<IngresoMateriaPrimaAttributes>, IngresoMateriaPrimaAttributes {
  MateriaPrima?: MateriaPrimaInstance;
  Usuario?: UsuarioInstance;
} 