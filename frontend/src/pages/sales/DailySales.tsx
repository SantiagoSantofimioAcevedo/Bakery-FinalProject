import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { format } from 'date-fns';
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

const DailySales: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/ventas/diarias', {
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
      toast.error('Error al cargar las ventas del día');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // Encabezados simplificados
    const headers = [
      'Venta #',
      'Fecha',
      'Hora',
      'Productos',
      'Total',
      'Método de Pago',
      'Vendedor'
    ];

    // Preparar los datos de forma más simple
    const csvData = ventas.map(venta => {
      const fecha = new Date(venta.fecha_hora);
      // Combinar todos los productos en una sola celda
      const productos = venta.DetalleVentas.map(
        detalle => `${detalle.cantidad} ${detalle.Receta.nombre} ($${detalle.precio_unitario})`
      ).join(' + ');

      return [
        venta.id,
        format(fecha, 'dd/MM/yyyy'),
        format(fecha, 'HH:mm'),
        productos,
        venta.total,
        'Efectivo',
        `${venta.Usuario.nombre} ${venta.Usuario.apellido}`
      ];
    });

    // Función para escapar campos que contienen comas o saltos de línea
    const escapeCsvField = (field: any) => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    // Convertir los datos a formato CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(escapeCsvField).join(','))
    ].join('\r\n');

    // Agregar BOM para que Excel reconozca los caracteres especiales
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    
    // Crear y descargar el archivo
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `Reporte_Ventas_${format(today, 'dd-MM-yyyy')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);

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
              Ventas del día {format(today, "EEEE d 'de' MMMM", { locale: es })}
            </h1>
            <p className="text-gray-600">Total: ${totalVentas.toLocaleString()}</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No hay ventas registradas hoy
                </td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(venta.fecha_hora), 'HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs">
                      {venta.DetalleVentas.map((detalle, index) => (
                        <div key={index}>
                          {detalle.cantidad}x {detalle.Receta.nombre}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${venta.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venta.metodo_pago}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venta.Usuario.nombre} {venta.Usuario.apellido}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Versión para imprimir */}
      <div className="hidden print:block print:visible print:absolute print:top-0 print:left-0 print:w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">La Parveria</h1>
          <h2 className="text-2xl mt-2">Reporte de Ventas Diarias</h2>
          <h3 className="text-xl mt-2">{format(today, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</h3>
          <div className="mt-4 text-lg font-bold">Total de Ventas del Día: ${totalVentas.toLocaleString()}</div>
        </div>

        {ventas.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            No hay ventas registradas para este día
          </div>
        ) : (
          ventas.map((venta) => (
            <div key={venta.id} className="mb-8 pb-6 page-break-inside-avoid">
              <div className="border-b-2 border-gray-300 pb-2 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <strong>Venta #:</strong> {venta.id}
                  </div>
                  <div>
                    <strong>Hora:</strong> {format(new Date(venta.fecha_hora), 'HH:mm')}
                  </div>
                  <div>
                    <strong>Vendedor:</strong> {venta.Usuario.nombre} {venta.Usuario.apellido}
                  </div>
                </div>
              </div>

              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 font-bold">Producto</th>
                    <th className="text-center py-2 font-bold">Cantidad</th>
                    <th className="text-right py-2 font-bold">Precio Unit.</th>
                    <th className="text-right py-2 font-bold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.DetalleVentas.map((detalle, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">{detalle.Receta.nombre}</td>
                      <td className="text-center py-2">{detalle.cantidad}</td>
                      <td className="text-right py-2">${detalle.precio_unitario.toLocaleString()}</td>
                      <td className="text-right py-2">${detalle.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-gray-300">
                    <td colSpan={3} className="text-right py-2">Total:</td>
                    <td className="text-right py-2">${venta.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-sm mt-2">
                <strong>Método de Pago:</strong> Efectivo
              </div>
            </div>
          ))
        )}

        <div className="mt-8 text-center text-sm border-t-2 border-gray-300 pt-4">
          <p>Reporte generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 20mm;
          }

          body {
            visibility: hidden;
          }

          .print\\:block {
            visibility: visible !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          th, td {
            padding: 8px;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default DailySales; 