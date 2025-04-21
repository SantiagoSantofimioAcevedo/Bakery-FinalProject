import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';

// Tipo para los datos del dashboard
interface DashboardData {
  inventoryAlerts: Array<{
    id: number;
    nombre: string;
    cantidad_stock: number;
    umbral_minimo: number;
    unidad_medida: string;
  }>;
  topSellingProducts: Array<{
    id: number;
    nombre: string;
    cantidad: number;
  }>;
  salesSummary: {
    today: number;
    todayFormatted: string;
    week: number;
    weekFormatted: string;
    month: number;
    monthFormatted: string;
  };
  productionToday: number;
}

const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    inventoryAlerts: [],
    topSellingProducts: [],
    salesSummary: { 
      today: 0, 
      todayFormatted: '0',
      week: 0, 
      weekFormatted: '0',
      month: 0,
      monthFormatted: '0'
    },
    productionToday: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3005/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar datos del dashboard');
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const isPanadero = user?.rol === 'panadero';
  
  // Encontrar la materia prima con menor stock
  const lowestStockItem = dashboardData.inventoryAlerts.length > 0 
    ? dashboardData.inventoryAlerts.reduce((prev, current) => 
        prev.cantidad_stock < current.cantidad_stock ? prev : current
      )
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bienvenido, {user?.nombre}</h1>
      
      {/* Tarjetas de resumen - Diferentes según el rol */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarjeta de Ventas de Hoy - Visible para todos los roles */}
        <div 
          onClick={() => handleCardClick('/sales/daily')}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-700">Ventas de Hoy</h2>
          <p className="text-3xl font-bold text-[#4D7C0F] mt-2">
            ${dashboardData.salesSummary.todayFormatted}
          </p>
          <p className="text-sm text-blue-600 mt-2">Click para ver detalles →</p>
        </div>

        {/* Tarjetas específicas para panaderos */}
        {isPanadero ? (
          <>
            <div 
              onClick={() => handleCardClick('/production')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-700">Producir</h2>
              <div className="flex items-center mt-2">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">Registrar nueva producción →</p>
            </div>
            <div 
              onClick={() => handleCardClick('/recipes')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-700">Crear Receta</h2>
              <div className="flex items-center mt-2">
                <div className="bg-amber-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">Añadir nueva receta →</p>
            </div>
          </>
        ) : (
          <>
            {/* Tarjetas específicas para administradores */}
            <div 
              onClick={() => handleCardClick('/sales/weekly')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-700">Ventas esta Semana</h2>
              <div className="flex items-center mt-2">
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#4D7C0F] ml-3">
                  ${dashboardData.salesSummary.weekFormatted}
                </p>
              </div>
              <p className="text-sm text-blue-600 mt-2">Click para ver detalles →</p>
            </div>
            <div 
              onClick={() => handleCardClick('/sales/monthly')}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-700">Ventas del Mes</h2>
              <div className="flex items-center mt-2">
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#4D7C0F] ml-3">
                  ${dashboardData.salesSummary.monthFormatted}
                </p>
              </div>
              <p className="text-sm text-blue-600 mt-2">Click para ver detalles →</p>
            </div>
          </>
        )}
      </div>

      {/* Tarjetas adicionales para panadero: Registrar ingreso y Gestionar inventario */}
      {isPanadero && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div 
            onClick={() => handleCardClick('/inventory/incoming')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">Registrar Nuevo Ingreso</h2>
            <div className="flex items-center mt-2">
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Añadir nuevo ingreso →</p>
          </div>
          
          <div 
            onClick={() => handleCardClick('/inventory')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">Gestionar Inventario</h2>
            <div className="flex items-center mt-2">
              <div className="bg-purple-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            {lowestStockItem ? (
              <div className="mt-2">
                <span className="text-sm text-red-600">Stock mínimo: {lowestStockItem.nombre}</span>
                <p className="text-sm font-medium">{lowestStockItem.cantidad_stock} {lowestStockItem.unidad_medida} disponibles</p>
              </div>
            ) : (
              <p className="text-sm text-green-600 mt-2">Inventario OK</p>
            )}
            <p className="text-sm text-blue-600 mt-2">Revisar inventario →</p>
          </div>
          
          <div 
            onClick={() => handleCardClick('/sales/new')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">Registrar Venta</h2>
            <div className="flex items-center mt-2">
              <div className="bg-orange-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Crear nueva venta →</p>
          </div>
        </div>
      )}
      
      {/* Accesos rápidos adicionales para administradores */}
      {!isPanadero && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div 
            onClick={() => handleCardClick('/production')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">Producir</h2>
            <div className="flex items-center mt-2">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Registrar nueva producción →</p>
          </div>
          <div 
            onClick={() => handleCardClick('/recipes')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">Crear Receta</h2>
            <div className="flex items-center mt-2">
              <div className="bg-amber-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Añadir nueva receta →</p>
          </div>
          <div 
            onClick={() => handleCardClick('/sales/new')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">Registrar Venta</h2>
            <div className="flex items-center mt-2">
              <div className="bg-orange-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Crear nueva venta →</p>
          </div>
        </div>
      )}
      
      {/* Alertas de inventario */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Alertas de Inventario</h2>
        {dashboardData.inventoryAlerts.length === 0 ? (
          <p className="text-green-600">No hay alertas de inventario bajo</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materia Prima
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Umbral Mínimo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.inventoryAlerts.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={item.cantidad_stock <= item.umbral_minimo ? "text-red-600 font-medium" : ""}>
                        {item.cantidad_stock} {item.unidad_medida}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.umbral_minimo} {item.unidad_medida}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Productos más vendidos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Productos Más Vendidos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidades Vendidas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.topSellingProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.cantidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;