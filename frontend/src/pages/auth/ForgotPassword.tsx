import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../services/authService';
import bakeryImage from '../../assets/images/bakery-login.jpeg';
import Button from '../../components/common/Button';

const ForgotPassword: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario || !masterPassword) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await requestPasswordReset({ usuario, masterPassword });
      // Si la verificación es exitosa, redirigir a la página de cambio de contraseña
      navigate('/reset-password', { state: { usuario } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Columna izquierda - Imagen */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={bakeryImage}
          alt="Productos de panadería"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Columna derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#B5A25F] px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-5xl font-extrabold text-white mb-2">La Parveria</h1>
            <h2 className="text-center text-xl text-white">Recuperación de Contraseña</h2>
          </div>
          
          <div className="bg-[#F5F1DE] p-8 rounded-lg shadow-md space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">Usuario</label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm"
                  placeholder="Ingrese el usuario a recuperar"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="masterPassword" className="block text-sm font-medium text-gray-700">Contraseña Maestra</label>
                <input
                  id="masterPassword"
                  name="masterPassword"
                  type="password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm"
                  placeholder="Ingrese la contraseña maestra"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                />
              </div>

              <div>
                <Button
                  label={isLoading ? 'Verificando...' : 'Verificar'}
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  fullWidth
                />
              </div>
            </form>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors duration-200"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 