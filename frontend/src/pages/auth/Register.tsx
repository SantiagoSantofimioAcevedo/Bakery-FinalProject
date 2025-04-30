import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import authService from '../../services/authService';

// Función para validar la seguridad de la contraseña
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  // Verificar si la contraseña es una secuencia numérica simple
  if (/^(0123|1234|2345|3456|4567|5678|6789|0987|9876|8765|7654|6543|5432|4321|3210)/.test(password)) {
    return 'La contraseña no puede ser una secuencia numérica simple';
  }
  
  // Verificar si la contraseña es demasiado común
  const commonPasswords = ['password', 'contraseña', '12345678', 'qwerty', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'La contraseña es demasiado común, elige una más segura';
  }
  
  // Verificar si contiene al menos un número y una letra
  if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return 'La contraseña debe contener al menos un número y una letra';
  }
  
  return null; // La contraseña es válida
};

// Componente para el modal de autorización de administrador
const AdminAuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAuth: (adminUser: string, adminPassword: string) => void;
  isAuthLoading: boolean;
  authError: string;
}> = ({ isOpen, onClose, onAuth, isAuthLoading, authError }) => {
  const [adminUser, setAdminUser] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth(adminUser, adminPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Autorización de Administrador</h2>
        <p className="mb-4 text-gray-600">Para crear una cuenta con rol de administrador, es necesario verificar con un administrador existente.</p>
        
        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminUser" className="block text-sm font-medium text-gray-700 mb-1">Usuario Administrador</label>
            <input
              id="adminUser"
              type="text"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#B5A25F]"
              placeholder="Usuario administrador"
              required
            />
          </div>
          
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#B5A25F]"
                placeholder="Contraseña"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-[#B5A25F] text-white rounded-lg hover:bg-[#9A8A50]"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminAuthVerified, setAdminAuthVerified] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el rol a administrador y no está verificado, resetear la verificación
    if (name === 'rol') {
      if (value === 'administrador') {
        setAdminAuthVerified(false);
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validar la contraseña cuando cambia
    if (name === 'contraseña') {
      setPasswordError(validatePassword(value));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si la contraseña es válida antes de enviar
    const passwordValidationError = validatePassword(formData.contraseña);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    // Si el rol es administrador y no se ha verificado, mostrar el modal
    if (formData.rol === 'administrador' && !adminAuthVerified) {
      setShowAdminModal(true);
      return;
    }
    
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

  const handleAdminAuth = async (adminUser: string, adminPassword: string) => {
    try {
      setIsAuthLoading(true);
      setAdminAuthError('');
      
      // Verificar las credenciales del administrador usando el nuevo servicio
      const response = await authService.verifyAdminCredentials({
        adminUsuario: adminUser,
        adminContraseña: adminPassword
      });
      
      if (response.isAdmin) {
        setAdminAuthVerified(true);
        setShowAdminModal(false);
      } else {
        setAdminAuthError('La cuenta no tiene permisos de administrador');
      }
    } catch (err: any) {
      console.error('Error de autenticación de administrador:', err);
      setAdminAuthError(err.response?.data?.message || 'Error al verificar credenciales');
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#B5A25F]">
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
        <div className="w-full max-w-md bg-[#B5A25F] rounded-3xl p-8">
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

            <div className="space-y-1">
              <div className="relative">
                <input
                  id="contraseña"
                  name="contraseña"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`w-full px-4 py-3 rounded-lg bg-[#F5F1DE] border-none text-gray-900 placeholder-gray-500 ${
                    passwordError ? 'border-red-500' : ''
                  }`}
                  placeholder="Contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-white text-sm bg-red-500 px-3 py-1 rounded">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="space-y-1">
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
              
              {formData.rol === 'administrador' && adminAuthVerified && (
                <p className="text-white text-sm bg-green-500 px-3 py-1 rounded">
                  Autorización de administrador verificada
                </p>
              )}
              
              {formData.rol === 'administrador' && !adminAuthVerified && (
                <p className="text-white text-sm bg-yellow-500 px-3 py-1 rounded">
                  Se requerirá verificación de un administrador existente
                </p>
              )}
            </div>

            <Button
              label={isLoading ? 'Registrando...' : 'Registrarse'}
              variant="register"
              type="submit"
              disabled={isLoading || !!passwordError || (formData.rol === 'administrador' && !adminAuthVerified && !showAdminModal)}
              fullWidth
            />
          </form>
        </div>
      </div>

      {/* Espacio blanco derecho */}
      <div className="hidden lg:block lg:w-1/4 bg-[#F8F8F8]"></div>
      
      {/* Modal de autenticación de administrador */}
      <AdminAuthModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onAuth={handleAdminAuth}
        isAuthLoading={isAuthLoading}
        authError={adminAuthError}
      />
    </div>
  );
};

export default Register;
