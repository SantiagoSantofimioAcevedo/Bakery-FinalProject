import api from './api';

export const getDashboardData = async () => {
  try {
    console.log('📊 Solicitando datos del dashboard de reportes...');
    const response = await api.get('/api/reportes/dashboard');
    console.log('✅ Datos del dashboard recibidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    throw error;
  }
};

export const getSalesReport = async (startDate: string, endDate: string) => {
  try {
    console.log(`📊 Solicitando reporte de ventas desde ${startDate} hasta ${endDate}...`);
    const response = await api.get(`/api/reportes/ventas?fechaInicio=${startDate}&fechaFin=${endDate}`);
    console.log('✅ Reporte de ventas recibido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching sales report:', error);
    throw error;
  }
};

export const getInventoryReport = async () => {
  try {
    console.log('📊 Solicitando reporte de inventario...');
    const response = await api.get('/api/reportes/inventario');
    console.log('✅ Reporte de inventario recibido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching inventory report:', error);
    throw error;
  }
};

export const getProductionReport = async (startDate: string, endDate: string) => {
  try {
    console.log(`📊 Solicitando reporte de producción desde ${startDate} hasta ${endDate}...`);
    const response = await api.get(`/api/reportes/produccion?fechaInicio=${startDate}&fechaFin=${endDate}`);
    console.log('✅ Reporte de producción recibido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching production report:', error);
    throw error;
  }
};

export const getProfitReport = async (startDate: string, endDate: string) => {
  try {
    console.log(`📊 Solicitando reporte de ganancias desde ${startDate} hasta ${endDate}...`);
    const response = await api.get(`/api/reportes/ganancias?fechaInicio=${startDate}&fechaFin=${endDate}`);
    console.log('✅ Reporte de ganancias recibido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching profit report:', error);
    throw error;
  }
};

export const getIngredientUsageReport = async (ingredientId: number, startDate: string, endDate: string) => {
  try {
    console.log(`📊 Solicitando reporte de uso de ingrediente ${ingredientId} desde ${startDate} hasta ${endDate}...`);
    const response = await api.get(
      `/api/reportes/uso-ingredientes/${ingredientId}?fechaInicio=${startDate}&fechaFin=${endDate}`
    );
    console.log('✅ Reporte de uso de ingrediente recibido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching ingredient usage report:', error);
    throw error;
  }
};