import api from './api';

export interface RecipeData {
  id?: number;
  nombre: string;
  ingredientes: string[];
  instrucciones: string;
}

export const getRecipes = async () => {
  try {
    const response = await api.get('/api/recetas');
    return response.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
};

export const getRecipeById = async (id: number) => {
  try {
    const response = await api.get(`/api/recetas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe with id ${id}:`, error);
    throw error;
  }
};

export const createRecipe = async (recipeData: RecipeData) => {
  try {
    const response = await api.post('/api/recetas', recipeData);
    return response.data;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

export const updateRecipe = async (id: number, recipeData: RecipeData) => {
  try {
    const response = await api.put(`/api/recetas/${id}`, recipeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating recipe with id ${id}:`, error);
    throw error;
  }
};

export const deleteRecipe = async (id: number) => {
  try {
    await api.delete(`/api/recetas/${id}`);
  } catch (error) {
    console.error(`Error deleting recipe with id ${id}:`, error);
    throw error;
  }
};

