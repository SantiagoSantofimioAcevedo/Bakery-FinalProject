import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../frontend/src/hooks/useAuth';

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
    { name: 'Recetas', path: '/recipes', icon: '📝' },
    { name: 'Producción', path: '/production', icon: '🍞' },
    { name: 'Ventas', path: '/sales', icon: '💰' },
    { name: 'Reportes', path: '/reports', icon: '📈' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-32'
        } bg-[#D4C686] transition-width duration-300 ease-in-out overflow-hidden relative z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-4xl font-extrabold text-white tracking-wider">La Parveria</h1>
          ) : (
            <h1 className="text-3xl font-extrabold text-white">🍞</h1>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-[#e5d9a3] text-white text-2xl ml-4 transition-transform duration-300 ${
              !sidebarOpen ? 'rotate-180' : ''
            }`}
          >
            ◀
          </button>
        </div>

        <nav className="mt-8">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={`flex items-center px-6 py-4 text-white hover:bg-[#e5d9a3] transition-colors duration-200 ${
                    location.pathname === item.path ? 'bg-[#e5d9a3] font-semibold' : ''
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-[#D4C686]">
          <div className={`flex justify-between items-center h-full px-6 py-4 ${!sidebarOpen ? 'ml-32' : ''} transition-all duration-300`}>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {menuItems.find((item) => item.path === location.pathname)?.name || 'Página'}
            </h2>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white tracking-wide">
                      {user.nombre} {user.apellido}
                    </div>
                    <div className="text-sm text-white font-medium">
                      {user.rol === 'administrador' ? 'Administrador' : 'Panadero'}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-base font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;