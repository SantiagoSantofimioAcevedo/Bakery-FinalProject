import api from './api';

export interface SaleItemData {
  recetaId: number;
  cantidad: number;
}

export interface SaleFormData {
  items: SaleItemData[];
}

export const getSales = async () => {
  try {
    const response = await api.get('/ventas');
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

export const getSaleById = async (id: number) => {
  try {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale with id ${id}:`, error);
    throw error;
  }
};

export const createSale = async (saleData: SaleFormData) => {
  try {
    const response = await api.post('/ventas', saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const getSalesSummary = async (timeframe: 'day' | 'week' | 'month' | 'year') => {
  try {
    const response = await api.get(`/ventas/summary?timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sales summary for ${timeframe}:`, error);
    throw error;
  }
};