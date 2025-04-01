export {};

export interface Receta {
  id?: number;
  nombre: string;
  descripcion?: string;
  tiempo_preparacion: number;
  tiempo_horneado: number;
  temperatura: number;
  instrucciones: string;
  precio_venta: number;
  imagen?: string;
  MateriaPrima?: RecetaIngrediente[];
}

export interface MateriaPrima {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad_disponible: number;
  unidad_medida: string;
  precio_unitario: number;
  categoria: string;
  fecha_vencimiento?: string;
  ubicacion?: string;
  RecetaIngrediente?: {
    cantidad: number;
    unidad_medida: string;
  };
}

export interface RecetaIngrediente {
  id: number;
  cantidad: number;
  unidad_medida: string;
}

export interface FormData {
  nombre: string;
  descripcion: string;
  tiempo_preparacion: number;
  tiempo_horneado: number;
  temperatura: number;
  instrucciones: string;
  precio_venta: number;
  imagen: File | null;
  ingredientes: RecetaIngrediente[];
}
