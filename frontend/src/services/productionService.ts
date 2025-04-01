import api from './api';

export interface ProductionFormData {
  recetaId: number;
  cantidad: number;
}

export const getProductions = async () => {
  try {
    const response = await api.get('/produccion');
    return response.data;
  } catch (error) {
    console.error('Error fetching productions:', error);
    throw error;
  }
};

export const getProductionById = async (id: number) => {
  try {
    const response = await api.get(`/produccion/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching production with id ${id}:`, error);
    throw error;
  }
};

export const createProduction = async (productionData: ProductionFormData) => {
  try {
    const response = await api.post('/produccion', productionData);
    return response.data;
  } catch (error) {
    console.error('Error creating production:', error);
    throw error;
  }
};

export const checkInventoryForRecipe = async (recipeId: number, quantity: number) => {
  try {
    const response = await api.get(`/recetas/${recipeId}/check-inventory?cantidad=${quantity}`);
    return response.data;
  } catch (error) {
    console.error('Error checking inventory for recipe:', error);
    throw error;
  }
};