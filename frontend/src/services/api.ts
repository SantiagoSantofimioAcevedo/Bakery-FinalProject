import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

console.log('API URL:', API_URL); // Para depuración

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de la petición
    console.log('🌐 Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data instanceof FormData 
        ? 'FormData (contenido no visible en consola)' 
        : config.data
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Error en la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar las respuestas
api.interceptors.response.use(
  (response) => {
    // Log de la respuesta exitosa
    console.log('✅ Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Log detallado del error
    console.error('❌ Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Si el error es de autenticación, limpiar el token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // En lugar de redirigir, dejamos que el componente maneje el error
    }
    
    return Promise.reject(error);
  }
);

export default api;