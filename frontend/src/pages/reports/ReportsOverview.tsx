import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardData } from '../../services/reportService';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';

interface DashboardData {
  ventasHoy: number;
  ventasHoyFormatted: string;
  ventasSemana: number;
  ventasSemanaFormatted: string;
  ventasMes: number;
  ventasMesFormatted: string;
  productosPopulares: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    porcentaje: number;
  }>;
  inventarioBajo: Array<{
    id: number;
    nombre: string;
    cantidad_stock: number;
    umbral_minimo: number;
    unidad_medida: string;
  }>;
  gananciasNetas: number;
  gananciasNetasFormatted: string;
}

const ReportsOverview: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  if (!dashboardData) {
    return <Alert message="No hay datos disponibles" type="warning" />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Resumen de Reportes</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => handleCardClick('/sales/daily')}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-700">Ventas de Hoy</h2>
          <p className="text-3xl font-bold text-[#4D7C0F] mt-2">
            ${dashboardData.ventasHoyFormatted}
          </p>
          <p className="text-sm text-blue-600 mt-2">Click para ver detalles →</p>
        </div>
        
        <div 
          onClick={() => handleCardClick('/sales/weekly')}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-700">Ventas de la Semana</h2>
          <p className="text-3xl font-bold text-[#4D7C0F] mt-2">
            ${dashboardData.ventasSemanaFormatted}
          </p>
          <p className="text-sm text-blue-600 mt-2">Click para ver detalles →</p>
        </div>
        
        <div 
          onClick={() => handleCardClick('/sales/monthly')}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-700">Ventas del Mes</h2>
          <p className="text-3xl font-bold text-[#4D7C0F] mt-2">
            ${dashboardData.ventasMesFormatted}
          </p>
          <p className="text-sm text-blue-600 mt-2">Click para ver detalles →</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Productos Más Populares" className="shadow-md">
          <div className="space-y-3">
            {dashboardData.productosPopulares.map((producto, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{producto.nombre}</span>
                <div className="flex items-center">
                  <span className="mr-2">{producto.cantidad} unidades</span>
                  <span className="text-sm text-gray-500">({producto.porcentaje}%)</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link to="/reports/sales" className="text-blue-600 hover:underline">
              Ver reporte completo
            </Link>
          </div>
        </Card>

        <Card title="Inventario Bajo" className="shadow-md">
          {dashboardData.inventarioBajo.length === 0 ? (
            <div className="text-gray-500">No hay materias primas con inventario bajo</div>
          ) : (
            <div className="space-y-3">
              {dashboardData.inventarioBajo.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.nombre}</span>
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">
                      {item.cantidad_stock} {item.unidad_medida}
                    </span>
                    <span className="text-sm text-gray-500">
                      (Mínimo: {item.umbral_minimo} {item.unidad_medida})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
            <Link to="/reports/inventory" className="text-blue-600 hover:underline">
              Ver reporte completo
            </Link>
          </div>
        </Card>
      </div>

      <Card title="Ganancias Netas" className="shadow-md">
        <div className="text-3xl font-bold text-emerald-600 text-center py-4">
          ${dashboardData.gananciasNetasFormatted}
        </div>
      </Card>
    </div>
  );
};

export default ReportsOverview;