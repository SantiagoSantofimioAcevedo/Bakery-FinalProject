import api from './api';

export interface ProductionFormData {
  recetaId: number;
  cantidad: number;
}

export interface InventoryError {
  message: string;
  ingredientesFaltantes?: Array<{
    nombre: string;
    cantidadNecesaria: number;
    cantidadDisponible: number;
    unidad: string;
  }>;
}

export interface ProductoDisponible {
  recetaId: number;
  totalProducido: number;
  totalVendido: number;
  disponible: number;
}

export const getProductions = async () => {
  try {
    const response = await api.get('/api/producciones');
    return response.data;
  } catch (error) {
    console.error('Error fetching productions:', error);
    throw error;
  }
};

export const getProductionById = async (id: number) => {
  try {
    const response = await api.get(`/api/producciones/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching production with id ${id}:`, error);
    throw error;
  }
};

export const createProduction = async (productionData: ProductionFormData) => {
  try {
    const response = await api.post('/api/producciones', productionData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating production:', error);
    if (error.response?.data?.ingredientesFaltantes) {
      throw {
        message: 'No hay suficientes ingredientes para esta producción',
        ingredientesFaltantes: error.response.data.ingredientesFaltantes
      } as InventoryError;
    }
    throw error;
  }
};

export const checkInventoryForRecipe = async (recipeId: number, quantity: number) => {
  try {
    const response = await api.get(`/api/recetas/${recipeId}/check-inventory?cantidad=${quantity}`);
    return response.data;
  } catch (error) {
    console.error('Error checking inventory for recipe:', error);
    throw error;
  }
};

export const getProductoDisponible = async (recetaId: number) => {
  try {
    const response = await api.get(`/api/recetas/${recetaId}/disponibilidad`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener disponibilidad para receta ${recetaId}:`, error);
    throw error;
  }
};