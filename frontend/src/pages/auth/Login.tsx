import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import bakeryImage from '../../assets/images/bakery-login.jpeg'; 
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir la propagación del evento
    
    if (!username || !password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setShowForgotPassword(false);
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error de login:', err);
      // Mantener los valores del formulario
      setUsername(username);
      setPassword(password);
      
      // Mostrar el mensaje de error del backend o un mensaje genérico
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión. Por favor verifique sus credenciales.';
      setError(errorMessage);
      setShowForgotPassword(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#D4C686] px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-5xl font-extrabold text-white mb-2">La Parveria</h1>
          </div>
          
          <div className="bg-[#F5F1DE] p-8 rounded-lg shadow-md space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuario</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4C686] focus:border-[#D4C686] sm:text-sm pr-10"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-500 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-500 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4C686] disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? 'Cargando...' : 'Iniciar sesión'}
                </button>
              </div>
            </form>

            <div className="text-center space-y-2">
              <Link 
                to="/register" 
                className="block text-sm text-gray-600 hover:text-gray-900 underline transition-colors duration-200"
              >
                Registrarse
              </Link>
              {showForgotPassword && (
                <Link 
                  to="/forgot-password" 
                  className="block text-sm text-gray-600 hover:text-gray-900 underline transition-colors duration-200"
                >
                  Olvidé mi contraseña
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;