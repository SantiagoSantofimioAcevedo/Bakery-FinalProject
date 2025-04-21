import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface Venta {
  id: number;
  fecha_hora: string;
  total: number;
  metodo_pago: string;
  DetalleVenta: {
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    Receta?: {
      nombre: string;
    };
    Recetum?: {
      nombre: string;
    };
  }[];
  Usuario: {
    nombre: string;
    apellido: string;
  };
}

const MonthlySales: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const navigate = useNavigate();
  
  // Obtener el inicio y fin del mes seleccionado
  const startDate = startOfMonth(selectedMonth);
  const endDate = endOfMonth(selectedMonth);

  useEffect(() => {
    fetchMonthlySales();
  }, [selectedMonth]);

  const fetchMonthlySales = async () => {
    try {
      let url = 'http://localhost:3005/api/ventas/mensuales';
      
      // Si no es el mes actual, usar el endpoint de rango
      const today = new Date();
      const currentMonthStart = startOfMonth(today);
      
      if (startDate.getTime() !== currentMonthStart.getTime()) {
        url = `http://localhost:3005/api/ventas/rango?fechaInicio=${startDate.toISOString()}&fechaFin=${endDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las ventas');
      }

      const data = await response.json();
      setVentas(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las ventas del mes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  // Comprobar si podemos avanzar al siguiente mes
  const canGoToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const today = new Date();
    return nextMonth <= today;
  };

  const isCurrentMonth = () => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    return startDate.getTime() === currentMonthStart.getTime();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // Preparar los datos para el CSV
    const rows = [];
    
    // Agregar encabezado del reporte
    rows.push(['Reporte de Ventas Mensual - La Parveria']);
    rows.push([`Periodo: ${format(startDate, "MMMM 'de' yyyy", { locale: es })}`]);
    rows.push([`Total de Ventas del Mes: $${totalVentasMes.toLocaleString()}`]);
    rows.push([]); // Línea en blanco

    // Encabezados de las columnas
    rows.push(['Fecha', 'Hora', 'Productos', 'Total', 'Vendedor']);

    // Agregar datos de ventas
    ventas.forEach((venta) => {
      const fecha = format(new Date(venta.fecha_hora), "d 'de' MMMM", { locale: es });
      const hora = format(new Date(venta.fecha_hora), 'HH:mm');
      const productos = venta.DetalleVenta.map(
        detalle => `${detalle.cantidad}x ${(detalle.Recetum?.nombre || detalle.Receta?.nombre) || "Producto sin nombre"}`
      ).join(', ');
      const vendedor = venta.Usuario ? `${venta.Usuario.nombre} ${venta.Usuario.apellido}` : 'No asignado';

      rows.push([
        fecha,
        hora,
        productos,
        venta.total.toString(),
        vendedor
      ]);
    });

    // Convertir a CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `Reporte_Ventas_Mensual_${format(startDate, 'MM-yyyy')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Agrupar ventas por día
  const ventasPorDia = ventas.reduce((acc, venta) => {
    const fechaVenta = new Date(venta.fecha_hora);
    const fecha = format(fechaVenta, 'yyyy-MM-dd');
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(venta);
    return acc;
  }, {} as Record<string, Venta[]>);

  const totalVentasMes = ventas.reduce((sum, venta) => sum + venta.total, 0);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Ventas Mensuales</h1>
        <div className="flex gap-4">
          <Button 
            label="Imprimir"
            onClick={handlePrint}
            className="print-button"
          />
          <Button 
            label="Descargar CSV"
            onClick={handleDownloadCSV}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button 
          label="Mes Anterior"
          onClick={handlePreviousMonth}
        />
        <h2 className="text-xl font-semibold">
          {format(startDate, "MMMM 'de' yyyy", { locale: es })}
        </h2>
        <Button 
          label="Mes Siguiente"
          onClick={handleNextMonth}
          disabled={!canGoToNextMonth()}
        />
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow print:hidden">
        <h3 className="text-lg font-semibold mb-2">Resumen del Mes</h3>
        <div className="text-2xl font-bold">
          Total: ${totalVentasMes.toLocaleString()}
        </div>
      </div>

      {/* Esta sección será visible tanto en pantalla como en impresión */}
      <div className="print:block">
        {Object.entries(ventasPorDia).map(([fecha, ventasDelDia]) => {
          const totalDia = ventasDelDia.reduce((sum, venta) => sum + venta.total, 0);
          const fechaObj = new Date(fecha + 'T00:00:00');
          return (
            <div key={fecha} className="mb-8 no-break">
              <h2 className="text-xl font-semibold mb-4">
                {format(fechaObj, "EEEE d 'de' MMMM", { locale: es })}
                <span className="ml-4 text-gray-600">Total del día: ${totalDia.toLocaleString()}</span>
              </h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasDelDia.map((venta) => (
                    <tr key={venta.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(venta.fecha_hora), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {venta.DetalleVenta.map((detalle, index) => (
                          <div key={index}>
                            {detalle.cantidad}x {(detalle.Recetum?.nombre || detalle.Receta?.nombre) || "Producto sin nombre"}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${venta.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {venta.Usuario ? `${venta.Usuario.nombre} ${venta.Usuario.apellido}` : 'No asignado'}
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
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">La Parveria</h1>
          <h2 className="text-xl mt-1">Reporte de Ventas Mensual</h2>
          <h3 className="text-lg mt-1">
            {format(startDate, "MMMM 'de' yyyy", { locale: es })}
          </h3>
          <div className="mt-2 font-bold">
            Total de Ventas del Mes: ${totalVentasMes.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySales; 