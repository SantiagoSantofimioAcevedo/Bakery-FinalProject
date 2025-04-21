import React, { useState, useEffect } from 'react';
import { getInventoryReport, getMateriaPrimaReport } from '../../services/reportService';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface MateriaPrima {
  id: number;
  nombre: string;
  cantidad_stock: number;
  umbral_minimo: number;
  unidad_medida: string;
  consumo?: number;
  porcentaje?: number;
}

interface ReportData {
  materiasPrimas: MateriaPrima[];
  materiasPrimasAgotadas: MateriaPrima[];
  materiasPrimasBajas: MateriaPrima[];
  consumoPorMateriaPrima?: {
    id: number;
    nombre: string;
    cantidad: number;
    unidad_medida: string;
    porcentaje?: number;
  }[];
  datosDemostracion?: boolean; // Indica si los datos mostrados son simulados
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];
const STATUS_COLORS = {
  normal: '#10B981', // verde
  bajo: '#FBBF24',   // amarillo
  critico: '#EF4444' // rojo
};

// Función para formatear números y limitar decimales
const formatNumber = (value: number): string => {
  return Number(value.toFixed(2)).toString();
};

const timeframeOptions = [
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
  { value: 'quarter', label: 'Último trimestre' },
  { value: 'year', label: 'Último año' }
];

// Estilos personalizados para el tooltip
const CustomTooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid #ccc',
  padding: '10px',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

// Custom prop types for recharts components
interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  fill: string;
  payload: {
    nombre: string;
    cantidad: number;
    unidad_medida: string;
    porcentaje?: number;
  };
  index: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={CustomTooltipStyle}>
        <p className="font-bold text-gray-800">{label}</p>
        <p className="text-blue-600 font-medium">
          Stock actual: {formatNumber(payload[0].value)} {payload[0].payload.unidad_medida}
        </p>
        <p className="text-gray-600 text-sm">
          Mínimo requerido: {formatNumber(payload[0].payload.umbral_minimo)} {payload[0].payload.unidad_medida}
        </p>
      </div>
    );
  }
  return null;
};

const InventoryReport: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<ReportData | null>(null);
  const [consumoData, setConsumoData] = useState<ReportData['consumoPorMateriaPrima'] | null>(null);
  const [timeframe, setTimeframe] = useState<string>('month');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'stock' | 'consumption'>('consumption');
  const [processedMateriasPrimas, setProcessedMateriasPrimas] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos de inventario actual
        const inventoryResult = await getInventoryReport();
        console.log('Datos de inventario recibidos:', inventoryResult);
        setInventoryData(inventoryResult);
        
        // Obtener datos de consumo de materias primas por período
        try {
          const consumoResult = await getMateriaPrimaReport(timeframe);
          console.log('Datos de consumo recibidos:', consumoResult);
          if (consumoResult && consumoResult.consumoPorMateriaPrima) {
            setConsumoData(consumoResult.consumoPorMateriaPrima);
            processConsumoData(consumoResult.consumoPorMateriaPrima);
          }
        } catch (consumoError) {
          console.error('Error al obtener datos de consumo:', consumoError);
          // No interrumpimos todo el proceso si falla solo la parte de consumo
          setProcessedMateriasPrimas([]);
        }
      } catch (err) {
        setError('Error al cargar los datos del reporte');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  // Función para procesar los datos y calcular porcentajes de consumo
  const processConsumoData = (materiasPrimas: any[]) => {
    if (!materiasPrimas || materiasPrimas.length === 0) return;
    
    // Calcular el total de unidades consumidas
    const totalConsumo = materiasPrimas.reduce((sum, mp) => sum + mp.cantidad, 0);
    
    // Calcular porcentajes para cada materia prima
    const mpWithPercentage = materiasPrimas.map(mp => ({
      ...mp,
      porcentaje: Math.round((mp.cantidad / totalConsumo) * 100)
    }));
    
    // Ordenar de mayor a menor consumo
    const sortedMps = [...mpWithPercentage].sort((a, b) => b.cantidad - a.cantidad);
    
    setProcessedMateriasPrimas(sortedMps);
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
    setViewType(viewType === 'stock' ? 'consumption' : 'stock');
  };

  // Determinar el estado del stock (normal, bajo, crítico)
  const getStockStatus = (item: MateriaPrima) => {
    if (item.cantidad_stock <= item.umbral_minimo * 0.5) return 'critico';
    if (item.cantidad_stock <= item.umbral_minimo) return 'bajo';
    return 'normal';
  };

  // Preparar datos para el gráfico de estado de inventario
  const prepareInventoryData = () => {
    if (!inventoryData || !inventoryData.materiasPrimas) return [];
    
    const processedData = inventoryData.materiasPrimas.map(item => ({
      ...item,
      porcentajeStock: Math.round((item.cantidad_stock / item.umbral_minimo) * 100),
      status: getStockStatus(item)
    }));
    
    // Ordenar por cantidad_stock de mayor a menor para mejor visualización
    return processedData.sort((a, b) => b.cantidad_stock - a.cantidad_stock);
  };

  const inventoryChartData = prepareInventoryData();
  
  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reporte de Inventario de Materias Primas</h1>
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
            {viewType === 'consumption' ? 'Ver Estado de Inventario' : 'Ver Consumo'}
          </button>
        </div>
      </div>

      {!inventoryData ? (
        <Alert message="No hay datos disponibles" type="info" />
      ) : (
        <div className="space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Materias Primas Agotadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {inventoryData.materiasPrimasAgotadas?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">items</p>
              </div>
            </Card>
            <Card className="bg-yellow-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Materias Primas Bajas</p>
                <p className="text-2xl font-bold text-amber-600">
                  {inventoryData.materiasPrimasBajas?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">items bajo umbral mínimo</p>
              </div>
            </Card>
            <Card className="bg-green-50 shadow-md">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Total Materias Primas</p>
                <p className="text-2xl font-bold text-green-600">
                  {inventoryData.materiasPrimas?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">items en inventario</p>
              </div>
            </Card>
          </div>

          {/* Contenido principal basado en viewType */}
          {viewType === 'consumption' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Materias Primas Más Consumidas" className="shadow-md">
                {inventoryData?.datosDemostracion && (
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded m-2 z-10">
                    Datos simulados para demostración
                  </div>
                )}
                <div className="h-80">
                  {processedMateriasPrimas.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedMateriasPrimas.slice(0, 10)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nombre" type="category" width={150} tick={{fontSize: 12}} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${formatNumber(Number(value))} ${processedMateriasPrimas.find(m => m.cantidad === value)?.unidad_medida || ''}`, 
                            'Cantidad'
                          ]} 
                        />
                        <Legend />
                        <Bar dataKey="cantidad" name="Consumo" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No hay datos de consumo disponibles para este período</p>
                    </div>
                  )}
                </div>
                {processedMateriasPrimas.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {processedMateriasPrimas.slice(0, 6).map((mp, index) => (
                      <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span>{mp.nombre}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2 font-medium">{formatNumber(mp.cantidad)} {mp.unidad_medida}</span>
                          <span className="text-sm text-gray-500">({mp.porcentaje || 0}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Distribución de Consumo" className="shadow-md">
                {inventoryData?.datosDemostracion && (
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded m-2 z-10">
                    Datos simulados para demostración
                  </div>
                )}
                <div className="h-80">
                  {processedMateriasPrimas.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedMateriasPrimas
                            .filter(item => (item.porcentaje || 0) >= 1)
                            .slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          innerRadius={0}
                          paddingAngle={2}
                          fill="#8884d8"
                          dataKey="cantidad"
                          nameKey="nombre"
                          label={(props: CustomLabelProps) => {
                            const RADIAN = Math.PI / 180;
                            const { cx, cy, midAngle, outerRadius, fill, payload, index } = props;
                            const sin = Math.sin(-RADIAN * midAngle);
                            const cos = Math.cos(-RADIAN * midAngle);
                            
                            const porcentaje = payload.porcentaje || 0;
                            const factorDistancia = porcentaje < 5 ? 0.8 : 1;
                            
                            const sx = cx + (outerRadius + 5) * cos;
                            const sy = cy + (outerRadius + 5) * sin;
                            const mx = cx + (outerRadius + 15 * factorDistancia) * cos;
                            const my = cy + (outerRadius + 15 * factorDistancia) * sin;
                            const ex = mx + (cos >= 0 ? 1 : -1) * 22 * factorDistancia;
                            const ey = my;
                            const textAnchor = cos >= 0 ? 'start' : 'end';
                            
                            if (porcentaje < 2) return null;
                            
                            return (
                              <g>
                                <path 
                                  d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} 
                                  stroke={fill} 
                                  strokeWidth={1.2}
                                  fill="none" 
                                />
                                <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                                <text 
                                  x={ex + (cos >= 0 ? 1 : -1) * 12} 
                                  y={ey} 
                                  dy={4}
                                  textAnchor={textAnchor} 
                                  fill="#333" 
                                  fontSize={11}
                                  fontWeight="500"
                                >
                                  {`${payload.nombre.substring(0, 8)}${payload.nombre.length > 8 ? '..' : ''}: ${porcentaje}%`}
                                </text>
                              </g>
                            );
                          }}
                        >
                          {processedMateriasPrimas
                            .filter(item => (item.porcentaje || 0) >= 1)
                            .slice(0, 6)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props?: any) => {
                            if (props && props.payload) {
                              return [
                                `${formatNumber(Number(value))} ${props.payload.unidad_medida || ''} (${props.payload.porcentaje || 0}%)`, 
                                props.payload.nombre || ''
                              ];
                            }
                            return [formatNumber(Number(value)), name];
                          }} 
                        />
                        <Legend 
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          iconSize={10}
                          iconType="circle"
                          wrapperStyle={{ 
                            paddingTop: '10px', 
                            width: '100%',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            paddingBottom: '5px'
                          }}
                          formatter={(value: string, entry: any, index: number) => {
                            // Obtener el elemento correspondiente del array de datos
                            const items = processedMateriasPrimas
                              .filter(item => (item.porcentaje || 0) >= 1)
                              .slice(0, 6);
                              
                            if (index < items.length) {
                              const item = items[index];
                              // Formato simplificado para la leyenda
                              return (
                                <span style={{ fontSize: '11px', color: '#333', display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.nombre}: {formatNumber(item.cantidad)} {item.unidad_medida} ({item.porcentaje}%)
                                </span>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No hay datos de consumo disponibles para este período</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Card title="Estado Actual del Inventario" className="shadow-md">
              {inventoryData.materiasPrimas && inventoryData.materiasPrimas.length > 0 ? (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareInventoryData().slice(0, 10)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="nombre" 
                          type="category" 
                          width={180} 
                          tick={{fontSize: 12}}
                          tickFormatter={(value: string) => {
                            // Asegurar que los nombres muy largos se acorten con puntos suspensivos
                            return value.length > 15 ? `${value.substring(0, 15)}...` : value;
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="cantidad_stock" 
                          name="Stock Actual" 
                          fill="#0088FE"
                          background={{ fill: '#eee' }}
                          isAnimationActive={false}
                        >
                          {prepareInventoryData().slice(0, 10).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.status === 'critico' 
                                  ? STATUS_COLORS.critico 
                                  : entry.status === 'bajo' 
                                    ? STATUS_COLORS.bajo 
                                    : STATUS_COLORS.normal
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Materia Prima</th>
                          <th className="py-2 px-4 border-b text-right">Stock Actual</th>
                          <th className="py-2 px-4 border-b text-right">Umbral Mínimo</th>
                          <th className="py-2 px-4 border-b text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prepareInventoryData()
                          .sort((a, b) => (a.cantidad_stock / a.umbral_minimo) - (b.cantidad_stock / b.umbral_minimo))
                          .map((item, index) => {
                            const status = getStockStatus(item);
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{item.nombre}</td>
                                <td className="py-2 px-4 border-b text-right">
                                  {formatNumber(item.cantidad_stock)} {item.unidad_medida}
                                </td>
                                <td className="py-2 px-4 border-b text-right">
                                  {formatNumber(item.umbral_minimo)} {item.unidad_medida}
                                </td>
                                <td className="py-2 px-4 border-b text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                                    ${status === 'critico' ? 'bg-red-100 text-red-800' : 
                                      status === 'bajo' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-green-100 text-green-800'}`}>
                                    {status === 'critico' ? 'Crítico' : 
                                    status === 'bajo' ? 'Bajo' : 
                                    'Normal'}
                                  </span>
                                </td>
                              </tr>
                            );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay materias primas en el inventario</p>
                </div>
              )}
            </Card>
          )}

          {/* Alertas de inventario bajo */}
          {inventoryData.materiasPrimasBajas && inventoryData.materiasPrimasBajas.length > 0 && (
            <Card title="Materias Primas con Inventario Bajo" className="shadow-md bg-yellow-50">
              <div className="space-y-3">
                {inventoryData.materiasPrimasBajas.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-yellow-100 rounded">
                    <span>{item.nombre}</span>
                    <div className="flex items-center">
                      <span className="text-amber-600 mr-2 font-medium">
                        {formatNumber(item.cantidad_stock)} {item.unidad_medida}
                      </span>
                      <span className="text-sm text-gray-500">
                        (Mínimo: {formatNumber(item.umbral_minimo)} {item.unidad_medida})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Materias primas agotadas */}
          {inventoryData.materiasPrimasAgotadas && inventoryData.materiasPrimasAgotadas.length > 0 && (
            <Card title="Materias Primas Agotadas" className="shadow-md bg-red-50">
              <div className="space-y-3">
                {inventoryData.materiasPrimasAgotadas.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-red-100 rounded">
                    <span>{item.nombre}</span>
                    <div className="flex items-center">
                      <span className="text-red-600 mr-2 font-medium">
                        {formatNumber(item.cantidad_stock)} {item.unidad_medida}
                      </span>
                      <span className="text-sm text-gray-500">
                        (Mínimo: {formatNumber(item.umbral_minimo)} {item.unidad_medida})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryReport;