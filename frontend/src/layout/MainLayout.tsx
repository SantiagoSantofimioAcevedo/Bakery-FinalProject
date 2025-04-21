import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../frontend/src/hooks/useAuth';
import Button from '../components/common/Button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Inventario', path: '/inventory', icon: '📦' },
    { name: 'Ingresos', path: '/inventory/incoming', icon: '🚛' },
    { name: 'Recetas', path: '/recipes', icon: '📝' },
    { name: 'Producción', path: '/production', icon: '🍞' },
    { name: 'Ventas', path: '/sales', icon: '💰' },
    ...(user?.rol === 'administrador' ? [
      { name: 'Reportes', path: '/reports', icon: '📈' },
      { name: 'Equipo', path: '/team', icon: '👥' }
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-32'
        } bg-[#B5A25F] transition-width duration-300 ease-in-out flex flex-col h-screen fixed`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-3xl font-extrabold text-white tracking-wider">La Parveria</h1>
          ) : (
            <h1 className="text-2xl font-extrabold text-white">🍞</h1>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-[#C4B27D] text-white text-2xl transition-transform duration-300 ${
              !sidebarOpen ? 'rotate-180' : ''
            }`}
          >
            ◀
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2 py-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={`flex items-center px-6 py-4 text-white hover:bg-[#C4B27D] transition-colors duration-200 ${
                    location.pathname === item.path ? 'bg-[#C4B27D] font-semibold' : ''
                  }`}
                >
                  <span className="text-2xl mr-4">{item.icon}</span>
                  {sidebarOpen && <span className="text-lg tracking-wide">{item.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-80' : 'ml-32'} transition-all duration-300`}>
        {/* Top Navbar */}
        <header className="bg-white border-b">
          <div className={`flex justify-between items-center h-full px-6 py-4 ${!sidebarOpen ? 'ml-32' : ''} transition-all duration-300`}>
            <h2 className="text-xl font-bold text-gray-800 tracking-wide">
              {menuItems.find((item) => item.path === location.pathname)?.name || 'Página'}
            </h2>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-800 tracking-wide">
                      {user.nombre} {user.apellido}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {user.rol === 'administrador' ? 'Administrador' : 'Panadero'}
                    </div>
                  </div>
                  <Button
                    label="Cerrar Sesión"
                    variant="danger"
                    onClick={handleLogout}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;