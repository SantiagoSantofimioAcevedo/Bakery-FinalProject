export interface MateriaPrima {
  id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_stock: number;
  costo_unitario: number;
  umbral_minimo: number;
  fecha_ultima_actualizacion: string;
}

export interface IngresoMateriaPrima {
  id: number;
  MateriaPrimaId: number;
  UsuarioId: number;
  fecha_ingreso: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
  costo_total: number;
  proveedor: string;
  numero_factura?: string;
  observaciones?: string;
  Usuario?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  MateriaPrima?: {
    id: number;
    nombre: string;
  };
}

export interface RegistroIngresoData {
  MateriaPrimaId: number;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
  costo_total?: number;
  proveedor: string;
  numero_factura?: string;
  observaciones?: string;
} 