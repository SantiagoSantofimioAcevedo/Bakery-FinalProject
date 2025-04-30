import axios from 'axios';
import { getAuthToken } from '../utils/auth';
import { RegisterData } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

export interface TeamMember {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: string;
  ultima_conexion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberDetail extends TeamMember {
  documento: string;
}

const equipoService = {
  // Obtener todos los miembros del equipo
  getTeamMembers: async (): Promise<TeamMember[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/equipo`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      if (!response.data.teamMembers) {
        throw new Error('Formato de respuesta inválido');
      }

      return response.data.teamMembers;
    } catch (error) {
      console.error('Error al obtener miembros del equipo:', error);
      throw error;
    }
  },

  // Obtener un miembro específico
  getTeamMember: async (id: number): Promise<TeamMemberDetail> => {
    try {
      const response = await axios.get(`${API_URL}/api/equipo/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener miembro del equipo:', error);
      throw error;
    }
  },

  // Actualizar un miembro
  updateTeamMember: async (id: number, data: Partial<TeamMemberDetail>): Promise<TeamMemberDetail> => {
    try {
      const response = await axios.put(`${API_URL}/api/equipo/${id}`, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.data.user;
    } catch (error) {
      console.error('Error al actualizar miembro del equipo:', error);
      throw error;
    }
  },

  // Crear un nuevo miembro
  createTeamMember: async (userData: RegisterData): Promise<TeamMemberDetail> => {
    try {
      const response = await axios.post(`${API_URL}/api/equipo/crear`, userData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.data.user;
    } catch (error) {
      console.error('Error al crear miembro del equipo:', error);
      throw error;
    }
  },

  // Eliminar un miembro
  deleteTeamMember: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/api/equipo/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
    } catch (error) {
      console.error('Error al eliminar miembro del equipo:', error);
      throw error;
    }
  }
};

export default equipoService; 