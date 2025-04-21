import React, { useState, useEffect } from 'react';
import { getProductPopularityReport } from '../../services/reportService';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface Product {
  id: number;
  nombre: string;
  cantidad: number;
  porcentaje?: number;
  total?: number;
}

interface DailyData {
  fecha: string;
  totalDia: number;
  cantidadVentas: number;
  productos: Product[];
}

interface ReportData {
  fechaInicio: string;
  fechaFin: string;
  totalVentas: number;
  totalProductos: number;
  cantidadVentas: number;
  ventasPorDia: DailyData[];
  resumenProductos: Product[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

const timeframeOptions = [
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
  { value: 'quarter', label: 'Último trimestre' },
  { value: 'year', label: 'Último año' }
];

const SalesReport = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [timeframe, setTimeframe] = useState<string>('month');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'daily' | 'product'>('daily');
  const [processedProducts, setProcessedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const data = await getProductPopularityReport(timeframe);
        setReportData(data);
        
        // Procesar los productos para calcular porcentajes correctamente
        if (data && data.resumenProductos && data.resumenProductos.length > 0) {
          processProductData(data.resumenProductos);
        }
        
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos del reporte');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [timeframe]);
  
  // Función para procesar los datos y calcular porcentajes
  const processProductData = (products: Product[]) => {
    if (!products || products.length === 0) return;
    
    // Calcular el total de unidades vendidas
    const totalUnits = products.reduce((sum, product) => sum + product.cantidad, 0);
    
    // Calcular porcentajes para cada producto
    const productsWithPercentage = products.map(product => ({
      ...product,
      porcentaje: Math.round((product.cantidad / totalUnits) * 100)
    }));
    
    setProcessedProducts(productsWithPercentage);
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

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(e.target.value);
  };

  const toggleViewType = () => {
    setViewType(viewType === 'daily' ? 'product' : 'daily');
  };

  const formatCurrency = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reporte de Ventas</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={handleTimeframeChange}
            className="px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={toggleViewType}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {viewType === 'daily' ? 'Ver por Producto' : 'Ver por Día'}
          </button>
        </div>
      </div>

      {!reportData ? (
        <Alert message="No hay datos disponibles para el período seleccionado" type="info" />
      ) : (
        <div className="space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Período</p>
                <p className="font-bold">{timeframeOptions.find(opt => opt.value === timeframe)?.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.fechaInicio} a {reportData.fechaFin}
                </p>
              </div>
            </Card>
            <Card className="bg-green-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Productos Vendidos</p>
                <p className="text-2xl font-bold">{reportData.totalProductos}</p>
                <p className="text-xs text-gray-500 mt-1">unidades</p>
              </div>
            </Card>
            <Card className="bg-yellow-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Ventas Realizadas</p>
                <p className="text-2xl font-bold">{reportData.cantidadVentas}</p>
                <p className="text-xs text-gray-500 mt-1">transacciones</p>
              </div>
            </Card>
            <Card className="bg-purple-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Total en Ventas</p>
                <p className="text-2xl font-bold">
                  ${formatCurrency(reportData.totalVentas)}
                </p>
                <p className="text-xs text-gray-500 mt-1">pesos colombianos</p>
              </div>
            </Card>
          </div>

          {/* Gráficos */}
          {viewType === 'daily' ? (
            <Card title="Ventas por Día" className="shadow-md">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.ventasPorDia}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${formatCurrency(Number(value))}`, 'Total']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalDia" 
                      name="Ventas"
                      stroke="#0088FE" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Fecha</th>
                      <th className="py-2 px-4 border-b text-right">Ventas</th>
                      <th className="py-2 px-4 border-b text-right">Total</th>
                      <th className="py-2 px-4 border-b text-left">Producto Más Vendido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.ventasPorDia.map((dia, index) => {
                      const productoPopular = dia.productos.length > 0 
                        ? dia.productos.sort((a, b) => b.cantidad - a.cantidad)[0] 
                        : null;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{dia.fecha}</td>
                          <td className="py-2 px-4 border-b text-right">{dia.cantidadVentas}</td>
                          <td className="py-2 px-4 border-b text-right">${formatCurrency(dia.totalDia)}</td>
                          <td className="py-2 px-4 border-b">
                            {productoPopular 
                              ? `${productoPopular.nombre} (${productoPopular.cantidad} unidades)` 
                              : 'No hay datos'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Distribución de Ventas por Producto" className="shadow-md">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedProducts.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                        nameKey="nombre"
                        label={({ nombre, porcentaje }) => `${nombre.substring(0, 12)}${nombre.length > 12 ? '...' : ''}: ${porcentaje || 0}%`}
                      >
                        {processedProducts.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} unidades ($${formatCurrency(props.payload.total || 0)})`, 
                          props.payload.nombre
                        ]} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Productos más Vendidos" className="shadow-md">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedProducts.slice(0, 10)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nombre" type="category" width={150} tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => [`${value} unidades`, 'Cantidad']} />
                      <Legend />
                      <Bar dataKey="cantidad" name="Cantidad" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Tabla de productos */}
          <Card title="Detalle de Productos" className="shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Producto</th>
                    <th className="py-2 px-4 border-b text-right">Cantidad</th>
                    <th className="py-2 px-4 border-b text-right">Total</th>
                    <th className="py-2 px-4 border-b text-right">Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {processedProducts.map((producto, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${index < 3 ? 'bg-green-50' : ''}`}>
                      <td className="py-2 px-4 border-b">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          {producto.nombre}
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b text-right">{producto.cantidad}</td>
                      <td className="py-2 px-4 border-b text-right">${formatCurrency(producto.total || 0)}</td>
                      <td className="py-2 px-4 border-b text-right">{producto.porcentaje || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
