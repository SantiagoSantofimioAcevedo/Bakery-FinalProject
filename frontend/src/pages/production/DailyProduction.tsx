import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { format } from 'date-fns';
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

const DailyProduction: React.FC = () => {
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetchDailyProductions();
  }, []);

  const fetchDailyProductions = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/producciones/diarias', {
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
      toast.error('Error al cargar las producciones del día');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // Preparar los datos para el CSV
    const rows = [];
    
    // Agregar encabezado del reporte
    rows.push(['Reporte de Producción Diaria - La Parveria']);
    rows.push([`Fecha: ${format(today, "d 'de' MMMM 'de' yyyy", { locale: es })}`]);
    rows.push([`Total de Productos Producidos: ${totalProductos}`]);
    rows.push([]); // Línea en blanco
    
    // Encabezados de la tabla
    rows.push([
      'Hora',
      'Producto',
      'Cantidad',
      'Panadero'
    ]);
    
    // Datos de las producciones
    producciones.forEach(produccion => {
      rows.push([
        format(new Date(produccion.fecha_hora), 'HH:mm'),
        produccion.Receta.nombre,
        produccion.cantidad,
        `${produccion.Usuario.nombre} ${produccion.Usuario.apellido}`
      ]);
    });
    
    // Convertir a CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produccion_diaria_${format(today, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProductos = producciones.reduce((sum, produccion) => sum + produccion.cantidad, 0);

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
              Producción del día {format(today, "EEEE d 'de' MMMM", { locale: es })}
            </h1>
            <p className="text-gray-600">Total de productos: {totalProductos}</p>
          </div>
          <div className="space-x-4">
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
            {producciones.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No hay producciones registradas hoy
                </td>
              </tr>
            ) : (
              producciones.map((produccion) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Versión para imprimir */}
      <div className="hidden print:block">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">La Parveria</h1>
          <h2 className="text-2xl mt-2">Reporte de Producción Diaria</h2>
          <h3 className="text-xl mt-2">
            {format(today, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </h3>
          <div className="mt-4 text-lg font-bold">
            Total de Productos Producidos: {totalProductos}
          </div>
        </div>

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
            {producciones.map((produccion) => (
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

        <div className="mt-8 text-center text-sm">
          <p>Reporte generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
        </div>
      </div>
    </div>
  );
};

export default DailyProduction; 