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
    console.log('Solicitando ventas al backend...');
    const response = await api.get('/api/ventas');
    console.log('Respuesta completa de la API:', response);
    console.log('Datos de ventas recibidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

export const getSaleById = async (id: number) => {
  try {
    const response = await api.get(`/api/ventas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale with id ${id}:`, error);
    throw error;
  }
};

export const createSale = async (saleData: SaleFormData) => {
  try {
    const transformedData = {
      detalles: saleData.items
    };
    
    console.log('Datos transformados para envío:', JSON.stringify(transformedData, null, 2));
    
    const response = await api.post('/api/ventas', transformedData);
    
    console.log('Respuesta de creación de venta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const getSalesSummary = async (timeframe: 'day' | 'week' | 'month' | 'year') => {
  try {
    const response = await api.get(`/api/ventas/summary?timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sales summary for ${timeframe}:`, error);
    throw error;
  }
};

export const deleteSale = async (id: number) => {
  try {
    console.log(`Enviando solicitud para eliminar venta con ID: ${id}`);
    const response = await api.delete(`/api/ventas/${id}`);
    console.log('Respuesta de eliminación:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error eliminando venta con id ${id}:`, error);
    throw error;
  }
};