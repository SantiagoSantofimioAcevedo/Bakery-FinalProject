import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: 'panadero' | 'administrador';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Aquí implementarás la validación del token cuando tengas ese endpoint
          // const response = await api.get('/auth/me');
          // setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    // Aquí implementarás el login cuando tengas ese endpoint
    // const response = await api.post('/auth/login', { username, password });
    // localStorage.setItem('token', response.data.token);
    // setUser(response.data.user);
    
    // Por ahora, simulamos un login para que puedas trabajar en el frontend
    const mockUsers = [
      { id: 1, nombre: 'Admin', apellido: 'Sistema', usuario: 'admin', rol: 'administrador' as const },
      { id: 2, nombre: 'Panadero', apellido: 'Prueba', usuario: 'panadero', rol: 'panadero' as const }
    ];
    
    const user = mockUsers.find(u => u.usuario === username);
    if (user && password === 'password123') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } else {
      throw new Error('Credenciales inválidas');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;