import api from './api';

export interface LoginCredentials {
  usuario: string;
  contraseña: string;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  documento: string;
  usuario: string;
  contraseña: string;
  rol: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
    usuario: string;
    rol: string;
  };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const authService = {
  login,
  register,
  getCurrentUser
};

export default authService;
