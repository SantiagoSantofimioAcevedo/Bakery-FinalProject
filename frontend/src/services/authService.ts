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

export interface PasswordResetRequest {
  usuario: string;
  masterPassword: string;
}

export interface PasswordResetResponse {
  message: string;
  usuario: string;
}

export interface PasswordResetConfirm {
  usuario: string;
  newPassword: string;
}

export interface AdminVerifyCredentials {
  adminUsuario: string;
  adminContraseña: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  } catch (error: any) {
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

export const verifyAdminCredentials = async (credentials: AdminVerifyCredentials): Promise<{ isAdmin: boolean }> => {
  try {
    const response = await api.post('/api/auth/verify-admin', credentials);
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

export const requestPasswordReset = async (data: PasswordResetRequest): Promise<PasswordResetResponse> => {
  try {
    const response = await api.post('/api/auth/request-password-reset', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (data: PasswordResetConfirm): Promise<void> => {
  try {
    await api.post('/api/auth/reset-password', data);
  } catch (error) {
    throw error;
  }
};

const authService = {
  login,
  register,
  verifyAdminCredentials,
  getCurrentUser,
  requestPasswordReset,
  resetPassword
};

export default authService;
