import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import authService, { RegisterData } from '../services/authService';

// Definición de tipos
type UserRole = 'panadero' | 'administrador';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Creación del contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos de autenticación desde localStorage al inicio
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setIsLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await authService.login({
        usuario: username,
        contraseña: password
      });

      // Verificar que el rol es válido
      if (response.user.rol !== 'panadero' && response.user.rol !== 'administrador') {
        throw new Error('Rol de usuario inválido');
      }

      // Guardar datos en el estado y localStorage
      const userData: User = {
        id: response.user.id,
        nombre: response.user.nombre,
        apellido: response.user.apellido,
        usuario: response.user.usuario,
        rol: response.user.rol as UserRole
      };
      
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.token);
      
    } catch (error) {
      console.error('Error durante el login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para registrar usuarios
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      await authService.register(userData);
      
      // No iniciamos sesión automáticamente después del registro
      // porque normalmente solo los administradores registran usuarios
      
    } catch (error) {
      console.error('Error durante el registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Valor del contexto
  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;