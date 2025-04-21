import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="text-6xl font-bold text-gray-300">404</div>
      <h1 className="text-3xl font-semibold mb-4">Página no encontrada</h1>
      <p className="text-gray-600 mb-6">Lo sentimos, la página que estás buscando no existe.</p>
      <Link to="/dashboard">
        <Button
          label="Volver al Dashboard"
          variant="primary"
        />
      </Link>
    </div>
  );
};

export default NotFound;