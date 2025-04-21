import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface Venta {
  id: number;
  fecha_hora: string;
  total: number;
  metodo_pago: string;
  DetalleVentas: {
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    Receta: {
      nombre: string;
    };
  }[];
  Usuario: {
    nombre: string;
    apellido: string;
  };
}

const WeeklySales: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const navigate = useNavigate();
  
  // Obtener el inicio y fin de la semana seleccionada
  const startDate = startOfWeek(selectedWeek, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(selectedWeek, { weekStartsOn: 0 }); // Sábado

  useEffect(() => {
    fetchWeeklySales();
  }, [selectedWeek]);

  const fetchWeeklySales = async () => {
    try {
      let url = 'http://localhost:3005/api/ventas/semanales';
      
      // Si no es la semana actual, usar el endpoint de rango
      const today = new Date();
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
      
      if (startDate.getTime() !== currentWeekStart.getTime()) {
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
      toast.error('Error al cargar las ventas de la semana');
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
    rows.push(['Reporte de Ventas Semanal - La Parveria']);
    rows.push([`Periodo: ${format(startDate, "d 'de' MMMM", { locale: es })} - ${format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`]);
    rows.push([`Total de Ventas de la Semana: $${totalVentasSemana.toLocaleString()}`]);
    rows.push([]); // Línea en blanco

    // Agrupar ventas por día
    const ventasPorDia = ventas.reduce((acc, venta) => {
      const fechaVenta = new Date(venta.fecha_hora);
      // Asegurarnos de que la fecha se maneje correctamente
      const fecha = format(fechaVenta, 'yyyy-MM-dd');
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(venta);
      return acc;
    }, {} as Record<string, Venta[]>);

    // Para cada día
    Object.entries(ventasPorDia).forEach(([fecha, ventasDelDia]) => {
      const totalDia = ventasDelDia.reduce((sum, venta) => sum + venta.total, 0);
      
      rows.push([format(new Date(fecha), "EEEE d 'de' MMMM", { locale: es })]);
      rows.push([`Total del día: $${totalDia.toLocaleString()}`]);
      
      // Encabezados de la tabla
      rows.push([
        'Hora',
        'Venta #',
        'Producto',
        'Cantidad',
        'Precio Unitario',
        'Subtotal',
        'Total Venta',
        'Vendedor',
        'Método de Pago'
      ]);

      // Datos de las ventas
      ventasDelDia.forEach(venta => {
        venta.DetalleVentas.forEach(detalle => {
          rows.push([
            format(new Date(venta.fecha_hora), 'HH:mm'),
            venta.id,
            detalle.Receta?.nombre || "Producto sin nombre",
            detalle.cantidad,
            detalle.precio_unitario,
            detalle.subtotal,
            venta.total,
            venta.Usuario ? `${venta.Usuario.nombre} ${venta.Usuario.apellido}` : 'No asignado',
            venta.metodo_pago || 'Efectivo'
          ]);
        });
      });

      rows.push([]); // Línea en blanco entre días
    });

    // Función para escapar campos especiales
    const escapeCsvField = (field: any) => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    // Convertir a CSV
    const csvContent = rows.map(row => row.map(escapeCsvField).join(',')).join('\r\n');

    // Agregar BOM para caracteres especiales en Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    
    // Descargar archivo
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `Reporte_Ventas_Semanal_${format(startDate, 'dd-MM-yyyy')}_${format(endDate, 'dd-MM-yyyy')}.csv`;
    
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
    // Asegurarnos de que la fecha se maneje correctamente
    const fecha = format(fechaVenta, 'yyyy-MM-dd');
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(venta);
    return acc;
  }, {} as Record<string, Venta[]>);

  const totalVentasSemana = ventas.reduce((sum, venta) => sum + venta.total, 0);

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
              Ventas de la semana ({format(startDate, "d 'de' MMMM", { locale: es })} - {format(endDate, "d 'de' MMMM", { locale: es })})
            </h1>
            <p className="text-gray-600">Total: ${totalVentasSemana.toLocaleString()}</p>
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

        {Object.entries(ventasPorDia).map(([fecha, ventasDelDia]) => {
          const totalDia = ventasDelDia.reduce((sum, venta) => sum + venta.total, 0);
          const fechaObj = new Date(fecha + 'T00:00:00'); // Asegurar que la fecha se interprete en la zona horaria local
          return (
            <div key={fecha} className="mb-8">
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
                        {venta.DetalleVentas.map((detalle, index) => (
                          <div key={index}>
                            {detalle.cantidad}x {detalle.Receta?.nombre || "Producto sin nombre"}
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
          <h2 className="text-xl mt-1">Reporte de Ventas Semanal</h2>
          <h3 className="text-lg mt-1">
            {format(startDate, "d 'de' MMMM", { locale: es })} - {format(endDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </h3>
          <div className="mt-2 font-bold">
            Total de Ventas de la Semana: ${totalVentasSemana.toLocaleString()}
          </div>
        </div>

        {Object.entries(ventasPorDia).map(([fecha, ventasDelDia]) => {
          const totalDia = ventasDelDia.reduce((sum, venta) => sum + venta.total, 0);
          const fechaObj = new Date(fecha + 'T00:00:00');
          return (
            <div key={fecha} className="mb-4 page-break-inside-avoid">
              <div className="font-bold border-b border-gray-400 pb-1 mb-2">
                {format(fechaObj, "EEEE d 'de' MMMM", { locale: es })}
                <span className="float-right">Total del día: ${totalDia.toLocaleString()}</span>
              </div>

              {ventasDelDia.map((venta) => (
                <div key={venta.id} className="mb-3">
                  <div className="grid grid-cols-3 text-sm mb-1">
                    <div>
                      <strong>Venta #:</strong> {venta.id}
                    </div>
                    <div>
                      <strong>Hora:</strong> {format(new Date(venta.fecha_hora), 'HH:mm')}
                    </div>
                    <div>
                      <strong>Vendedor:</strong> {venta.Usuario ? `${venta.Usuario.nombre} ${venta.Usuario.apellido}` : 'No asignado'}
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-1">Producto</th>
                        <th className="text-center py-1 w-20">Cant.</th>
                        <th className="text-right py-1 w-24">P.Unit</th>
                        <th className="text-right py-1 w-24">Subt.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.DetalleVentas.map((detalle, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-1">{detalle.Receta?.nombre || "Producto sin nombre"}</td>
                          <td className="text-center py-1">{detalle.cantidad}</td>
                          <td className="text-right py-1">${detalle.precio_unitario}</td>
                          <td className="text-right py-1">${detalle.subtotal}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="text-right py-1">
                          <strong>Total:</strong>
                        </td>
                        <td className="text-right py-1">
                          <strong>${venta.total}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-sm mt-1">
                    <strong>Método de Pago:</strong> {venta.metodo_pago || 'Efectivo'}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div className="text-center text-xs mt-2 pt-1 border-t border-gray-300">
          <p>Reporte generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body {
            visibility: hidden;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.2;
          }

          .print\\:block {
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 8mm;
          }

          .print\\:hidden {
            display: none !important;
          }

          h1 {
            font-size: 20px;
            margin: 0 0 4px 0;
          }

          h2 {
            font-size: 16px;
            margin: 0 0 4px 0;
          }

          h3 {
            font-size: 14px;
            margin: 0 0 4px 0;
          }

          p {
            margin: 0;
          }

          .text-sm {
            font-size: 11px;
          }

          .text-xs {
            font-size: 10px;
          }

          table {
            width: 100%;
            margin: 4px 0;
            border-collapse: collapse;
          }

          th, td {
            padding: 2px 4px;
          }

          .mb-1 {
            margin-bottom: 2px;
          }

          .mb-2 {
            margin-bottom: 4px;
          }

          .mb-3 {
            margin-bottom: 6px;
          }

          .mb-4 {
            margin-bottom: 8px;
          }

          .mt-1 {
            margin-top: 2px;
          }

          .mt-2 {
            margin-top: 4px;
          }

          .py-1 {
            padding-top: 2px;
            padding-bottom: 2px;
          }

          .pb-1 {
            padding-bottom: 2px;
          }

          .pt-1 {
            padding-top: 2px;
          }

          .grid-cols-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }

          .border-b {
            border-bottom-width: 1px;
          }

          .border-t {
            border-top-width: 1px;
          }

          .border-gray-100 {
            border-color: #f3f4f6;
          }

          .border-gray-300 {
            border-color: #d1d5db;
          }

          .border-gray-400 {
            border-color: #9ca3af;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid;
          }

          .float-right {
            float: right;
          }

          strong {
            font-weight: bold;
          }

          .w-20 {
            width: 60px;
          }

          .w-24 {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default WeeklySales; 