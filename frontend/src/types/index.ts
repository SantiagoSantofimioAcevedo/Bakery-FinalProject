export {};

export interface Receta {
  id: number;
  nombre: string;
  descripcion?: string;
  tiempo_preparacion: number;
  tiempo_horneado: number;
  temperatura: number;
  instrucciones: string;
  precio_venta: number;
  imagen?: string;
  imagen_url?: string;
  MateriaPrimas?: MateriaPrima[];
}

export interface MateriaPrima {
  id: number;
  nombre: string;
  unidad_medida: string;
  RecetaIngrediente?: RecetaIngrediente;
}

export interface RecetaIngrediente {
  id?: number;
  cantidad: string | number;
  unidad_medida: string;
  nombre?: string;
}

export interface RecipeFormData {
  id?: number;
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

export interface FormIngrediente {
  id: number;
  nombre?: string;
  cantidad: string | number;
  unidad_medida: string;
}
