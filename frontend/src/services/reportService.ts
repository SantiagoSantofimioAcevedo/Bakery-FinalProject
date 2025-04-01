import api from './api';

export const getDashboardData = async () => {
  try {
    const response = await api.get('/reportes/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export const getSalesReport = async (startDate: string, endDate: string) => {
  try {
    const response = await api.get(`/reportes/ventas?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales report:', error);
    throw error;
  }
};

export const getInventoryReport = async () => {
  try {
    const response = await api.get('/reportes/inventario');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error;
  }
};

export const getProductionReport = async (startDate: string, endDate: string) => {
  try {
    const response = await api.get(`/reportes/produccion?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching production report:', error);
    throw error;
  }
};

export const getProfitReport = async (startDate: string, endDate: string) => {
  try {
    const response = await api.get(`/reportes/ganancias?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profit report:', error);
    throw error;
  }
};

export const getIngredientUsageReport = async (ingredientId: number, startDate: string, endDate: string) => {
  try {
    const response = await api.get(
      `/reportes/uso-ingredientes/${ingredientId}?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching ingredient usage report:', error);
    throw error;
  }
};