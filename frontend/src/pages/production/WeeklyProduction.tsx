import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface Produccion {
  id: number;
  fecha_hora: string;
  cantidad: number;
  Receta: {
    nombre: string;
  };
  Usuario: {
    nombre: string;
    apellido: string;
  };
}

const WeeklyProduction: React.FC = () => {
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const navigate = useNavigate();
  
  // Obtener el inicio y fin de la semana seleccionada
  const startDate = startOfWeek(selectedWeek, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(selectedWeek, { weekStartsOn: 0 }); // Sábado

  useEffect(() => {
    fetchWeeklyProductions();
  }, [selectedWeek]);

  const fetchWeeklyProductions = async () => {
    try {
      let url = 'http://localhost:3005/api/producciones/semanales';
      
      // Si no es la semana actual, usar el endpoint de rango
      const today = new Date();
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
      
      if (startDate.getTime() !== currentWeekStart.getTime()) {
        url = `http://localhost:3005/api/producciones/rango?fechaInicio=${startDate.toISOString()}&fechaFin=${endDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las producciones');
      }

      const data = await response.json();
      setProducciones(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las producciones de la semana');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setSelectedWeek(prevDate => subWeeks(prevDate, 1));
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    if (nextWeek <= new Date()) {
      setSelectedWeek(nextWeek);
    }
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    return startDate.getTime() === currentWeekStart.getTime();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // Preparar los datos para el CSV
    const rows = [];
    
    // Agregar encabezado del reporte
    rows.push(['Reporte de Producción Semanal - La Parveria']);
    rows.push([`Periodo: ${format(startDate, "d 'de' MMMM", { locale: es })} - ${format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`]);
    rows.push([`Total de Productos Producidos: ${totalProductos}`]);
    rows.push([]); // Línea en blanco

    // Agrupar producciones por día
    const produccionesPorDia = producciones.reduce((acc, produccion) => {
      // Asegurarnos de que la fecha se interprete en la zona horaria local
      const fechaProduccion = new Date(produccion.fecha_hora);
      const fecha = format(fechaProduccion, 'yyyy-MM-dd');
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push({
        ...produccion,
        fecha_hora: fechaProduccion.toISOString() // Asegurarnos de que la fecha está en formato ISO
      });
      return acc;
    }, {} as Record<string, Produccion[]>);

    // Para cada día
    Object.entries(produccionesPorDia).forEach(([fecha, produccionesDia]) => {
      const totalDia = produccionesDia.reduce((sum, prod) => sum + prod.cantidad, 0);
      
      rows.push([format(new Date(fecha), "EEEE d 'de' MMMM", { locale: es })]);
      rows.push([`Total del día: ${totalDia}`]);
      
      // Encabezados de la tabla
      rows.push([
        'Hora',
        'Producto',
        'Cantidad',
        'Panadero'
      ]);

      // Datos de las producciones del día
      produccionesDia.forEach(produccion => {
        rows.push([
          format(new Date(produccion.fecha_hora), 'HH:mm'),
          produccion.Receta.nombre,
          produccion.cantidad,
          `${produccion.Usuario.nombre} ${produccion.Usuario.apellido}`
        ]);
      });

      rows.push([]); // Línea en blanco entre días
    });
    
    // Convertir a CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produccion_semanal_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProductos = producciones.reduce((sum, produccion) => sum + produccion.cantidad, 0);

  // Agrupar producciones por día
  const produccionesPorDia = producciones.reduce((acc, produccion) => {
    // Asegurarnos de que la fecha se interprete en la zona horaria local
    const fechaProduccion = new Date(produccion.fecha_hora);
    const fecha = format(fechaProduccion, 'yyyy-MM-dd');
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push({
      ...produccion,
      fecha_hora: fechaProduccion.toISOString() // Asegurarnos de que la fecha está en formato ISO
    });
    return acc;
  }, {} as Record<string, Produccion[]>);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Cargando...</div>;
  }

  return (
    <div className="p-6">
      {/* Contenido visible solo en pantalla */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Producción de la semana ({format(startDate, "d 'de' MMMM", { locale: es })} - {format(endDate, "d 'de' MMMM", { locale: es })})
            </h1>
            <p className="text-gray-600">Total de productos: {totalProductos}</p>
          </div>
          <div className="space-x-4 flex items-center">
            <Button
              label="Semana Anterior"
              onClick={handlePreviousWeek}
              variant="secondary"
            />
            {!isCurrentWeek() && (
              <Button
                label="Semana Siguiente"
                onClick={handleNextWeek}
                variant="secondary"
              />
            )}
            <Button
              label="Imprimir"
              onClick={handlePrint}
              variant="secondary"
            />
            <Button
              label="Descargar CSV"
              onClick={handleDownloadCSV}
              variant="primary"
            />
            <Button
              label="Volver"
              onClick={() => navigate('/dashboard')}
              variant="secondary"
            />
          </div>
        </div>

        {Object.entries(produccionesPorDia).map(([fecha, produccionesDia]) => {
          const totalDia = produccionesDia.reduce((sum, produccion) => sum + produccion.cantidad, 0);
          const fechaObjeto = new Date(fecha + 'T00:00:00'); // Crear objeto de fecha a partir de la fecha en formato yyyy-MM-dd
          return (
            <div key={fecha} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })}
                <span className="ml-4 text-gray-600">Total del día: {totalDia}</span>
              </h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Panadero</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produccionesDia.map((produccion) => (
                    <tr key={produccion.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(produccion.fecha_hora), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {produccion.Receta.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produccion.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produccion.Usuario.nombre} {produccion.Usuario.apellido}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Versión para imprimir */}
      <div className="hidden print:block">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">La Parveria</h1>
          <h2 className="text-2xl mt-2">Reporte de Producción Semanal</h2>
          <h3 className="text-xl mt-2">
            {format(startDate, "d 'de' MMMM", { locale: es })} - {format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </h3>
          <div className="mt-4 text-lg font-bold">
            Total de Productos Producidos: {totalProductos}
          </div>
        </div>

        {Object.entries(produccionesPorDia).map(([fecha, produccionesDia]) => {
          const totalDia = produccionesDia.reduce((sum, produccion) => sum + produccion.cantidad, 0);
          const fechaObjeto = new Date(fecha + 'T00:00:00'); // Crear objeto de fecha a partir de la fecha en formato yyyy-MM-dd
          return (
            <div key={fecha} className="mb-8 page-break-inside-avoid">
              <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
                {format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })}
              </h2>
              <p className="mb-4 font-semibold">Total del día: {totalDia}</p>

              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2">Hora</th>
                    <th className="border border-gray-300 px-4 py-2">Producto</th>
                    <th className="border border-gray-300 px-4 py-2">Cantidad</th>
                    <th className="border border-gray-300 px-4 py-2">Panadero</th>
                  </tr>
                </thead>
                <tbody>
                  {produccionesDia.map((produccion) => (
                    <tr key={produccion.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        {format(new Date(produccion.fecha_hora), 'HH:mm')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {produccion.Receta.nombre}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {produccion.cantidad}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {produccion.Usuario.nombre} {produccion.Usuario.apellido}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        <div className="mt-8 text-center text-sm">
          <p>Reporte generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProduction; 