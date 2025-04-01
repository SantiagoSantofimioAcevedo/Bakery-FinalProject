import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="text-6xl font-bold text-gray-300">404</div>
      <h1 className="text-3xl font-semibold mb-4">Página no encontrada</h1>
      <p className="text-gray-600 mb-6">Lo sentimos, la página que estás buscando no existe.</p>
      <Link 
        to="/dashboard" 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
};

export default NotFound;