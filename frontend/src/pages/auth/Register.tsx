import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen flex bg-[#D4C686]">
      {/* Espacio blanco izquierdo */}
      <div className="hidden lg:block lg:w-1/4 bg-[#F8F8F8] relative">
        <Link 
          to="/login"
          className="absolute top-8 left-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Regresar
        </Link>
      </div>

      {/* Contenido central */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#D4C686] rounded-3xl p-8">
          <div className="mb-8">
            <h1 className="text-center text-5xl font-extrabold text-white mb-2">La Parveria</h1>
            <h2 className="text-center text-3xl font-bold text-white">Crear una cuenta</h2>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900 placeholder-gray-500"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
            />

            <input
              id="apellido"
              name="apellido"
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900 placeholder-gray-500"
              placeholder="Apellidos"
              value={formData.apellido}
              onChange={handleChange}
            />

            <input
              id="documento"
              name="documento"
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900 placeholder-gray-500"
              placeholder="Numero de documento"
              value={formData.documento}
              onChange={handleChange}
            />

            <div className="border-t border-white my-6"></div>

            <input
              id="usuario"
              name="usuario"
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900 placeholder-gray-500"
              placeholder="Usuario"
              value={formData.usuario}
              onChange={handleChange}
            />

            <input
              id="contraseña"
              name="contraseña"
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900 placeholder-gray-500"
              placeholder="Contraseña"
              value={formData.contraseña}
              onChange={handleChange}
            />

            <select
              id="rol"
              name="rol"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900"
              value={formData.rol}
              onChange={handleChange}
            >
              <option value="panadero">Panadero</option>
              <option value="administrador">Administrador</option>
            </select>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-6 bg-[#F5F1DE] text-gray-900 rounded-lg font-medium hover:bg-[#eae6d3] disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>

      {/* Espacio blanco derecho */}
      <div className="hidden lg:block lg:w-1/4 bg-[#F8F8F8]"></div>
    </div>
  );
};

export default Register;
