import React, { useEffect, useState } from 'react';
import { FaUserFriends, FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import equipoService, { TeamMember } from '../services/equipoService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EditTeamMemberModal from '../components/EditTeamMemberModal';
import CreateUserModal from '../components/CreateUserModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Equipo: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeamMembers = async () => {
    try {
      const data = await equipoService.getTeamMembers();
      console.log('Datos recibidos del servidor:', data);
      setTeamMembers(data);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al cargar los miembros del equipo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await equipoService.deleteTeamMember(id);
        toast.success('Usuario eliminado exitosamente');
        loadTeamMembers();
      } catch (error) {
        toast.error('Error al eliminar el usuario');
      }
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      console.log('Fecha nula');
      return 'Nunca';
    }
    try {
      console.log('Intentando formatear fecha:', date);
      const formattedDate = format(new Date(date), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
      console.log('Fecha formateada:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error al formatear la fecha:', error, 'Fecha original:', date);
      return 'Fecha inválida';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] overflow-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          {FaUserFriends({ className: "w-6 h-6 mr-3 text-gray-700" })}
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Equipo</h1>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          {FaUserPlus({ className: "w-4 h-4 mr-2" })}
          Crear nuevo usuario
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Última Conexión
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teamMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {member.nombre} {member.apellido}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.usuario}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                    member.rol === 'administrador' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {member.rol}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {member.ultima_conexion ? formatDate(member.ultima_conexion) : 'Nunca'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(member)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    {FaEdit({ className: "inline w-4 h-4 mr-1" })} Editar
                  </button>
                  <div className="inline-block w-20"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <EditTeamMemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onUpdate={loadTeamMembers}
        />
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={loadTeamMembers}
      />
    </div>
  );
};

export default Equipo; 