import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    usuario: '',
    contraseña: '',
    rol: 'panadero'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      await register({
        nombre: formData.nombre,
        apellido: formData.apellido,
        documento: formData.documento,
        usuario: formData.usuario,
        contraseña: formData.contraseña,
        rol: formData.rol
      });
      
      navigate('/login');
    } catch (err: any) {
      console.error('Error de registro:', err);
      setError(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D4C686] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-5xl font-extrabold text-white mb-2">La Parveria</h1>
          <h2 className="text-center text-3xl font-bold text-white">Crear una cuenta</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm bg-[#F5F1DE]"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div>
              <input
                id="apellido"
                name="apellido"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm bg-[#F5F1DE]"
                placeholder="Apellidos"
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>

            <div>
              <input
                id="documento"
                name="documento"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm bg-[#F5F1DE]"
                placeholder="Numero de documento"
                value={formData.documento}
                onChange={handleChange}
              />
            </div>

            <div className="border-t border-white my-6"></div>

            <div>
              <input
                id="usuario"
                name="usuario"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm bg-[#F5F1DE]"
                placeholder="Usuario"
                value={formData.usuario}
                onChange={handleChange}
              />
            </div>

            <div>
              <input
                id="contraseña"
                name="contraseña"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm bg-[#F5F1DE]"
                placeholder="Contraseña"
                value={formData.contraseña}
                onChange={handleChange}
              />
            </div>

            <div>
              <select
                id="rol"
                name="rol"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm bg-[#F5F1DE]"
                value={formData.rol}
                onChange={handleChange}
              >
                <option value="panadero">Panadero</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-[#F5F1DE] hover:bg-[#eae6d3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4C686] disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
