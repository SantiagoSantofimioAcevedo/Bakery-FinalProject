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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow transition-width duration-300 ease-in-out overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-gray-800">Panadería App</h1>
          ) : (
            <h1 className="text-xl font-bold text-gray-800">🍞</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={`flex items-center p-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                    location.pathname === item.path ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {sidebarOpen && <span>{item.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow">
          <div className="px-4 py-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.name || 'Página'}
            </h2>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center">
                  <div className="mr-4 text-right">
                    <div className="text-sm font-medium text-gray-900">{user.nombre} {user.apellido}</div>
                    <div className="text-xs text-gray-500">{user.rol === 'administrador' ? 'Administrador' : 'Panadero'}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;