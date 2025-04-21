import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

interface Receta {
  id: number;
  nombre: string;
  precio_venta: number;
}

interface DetalleVentaAPI {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  Receta?: Receta | null;
  Recetum?: Receta | null;
  RecetumId?: number;
  RecetaId?: number;
}

interface DetalleVenta {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  Receta: Receta;
}

interface Venta {
  id: number;
  fecha_hora: string;
  total: number;
  metodo_pago: string;
  DetalleVentas: DetalleVentaAPI[];
  Usuario: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

const EditSale: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);

  useEffect(() => {
    fetchVentaDetails();
  }, [id]);

  const fetchVentaDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3005/api/ventas/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la venta');
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (!data || !data.DetalleVentas) {
        throw new Error('Los datos de la venta están incompletos');
      }

      // Asegurarse de que los detalles tengan toda la información necesaria
      const detallesCompletos = data.DetalleVentas.map((detalle: DetalleVentaAPI): DetalleVenta => ({
        id: detalle.id,
        cantidad: detalle.cantidad || 0,
        precio_unitario: detalle.precio_unitario || 0,
        subtotal: detalle.subtotal || 0,
        Receta: detalle.Recetum || detalle.Receta || {
          id: detalle.RecetumId || detalle.RecetaId || 0,
          nombre: 'Producto no encontrado',
          precio_venta: detalle.precio_unitario || 0
        }
      }));

      setVenta(data);
      setDetalles(detallesCompletos);
    } catch (error) {
      console.error('Error al cargar los detalles:', error);
      toast.error('Error al cargar los detalles de la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = (index: number, newCantidad: number) => {
    if (isNaN(newCantidad) || newCantidad < 0) return;

    const newDetalles = [...detalles];
    const detalle = newDetalles[index];
    if (!detalle) return;

    newDetalles[index] = {
      ...detalle,
      cantidad: newCantidad,
      subtotal: newCantidad * detalle.precio_unitario
    };
    setDetalles(newDetalles);
  };

  const handlePrecioUnitarioChange = (index: number, newPrecio: number) => {
    if (isNaN(newPrecio) || newPrecio < 0) return;

    const newDetalles = [...detalles];
    const detalle = newDetalles[index];
    if (!detalle) return;

    newDetalles[index] = {
      ...detalle,
      precio_unitario: newPrecio,
      subtotal: detalle.cantidad * newPrecio
    };
    setDetalles(newDetalles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const total = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
      
      // Preparar los detalles en el formato que espera el backend
      const detallesFormateados = detalles.map(detalle => ({
        id: detalle.id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
        RecetumId: detalle.Receta?.id || null
      }));

      const ventaActualizada = {
        id: id,
        detalles: detallesFormateados,
        total: total,
        metodo_pago: venta?.metodo_pago || 'Efectivo'
      };

      console.log('Datos a enviar al servidor:', JSON.stringify(ventaActualizada, null, 2));

      const response = await fetch(`http://localhost:3005/api/ventas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(ventaActualizada)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error del servidor:', errorData);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      if (responseData.DetalleVentas) {
        const detallesActualizados = responseData.DetalleVentas.map((detalle: DetalleVentaAPI) => ({
          id: detalle.id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal,
          Receta: detalle.Recetum || detalle.Receta || {
            id: detalle.RecetumId || 0,
            nombre: 'Producto no encontrado',
            precio_venta: detalle.precio_unitario
          }
        }));
        setDetalles(detallesActualizados);
        setVenta(responseData);
      }

      toast.success('Venta actualizada correctamente');
      navigate('/sales');
    } catch (error) {
      console.error('Error al actualizar la venta:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la venta');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Editar Venta #{id}</h1>
        <Button
          label="Volver"
          onClick={() => navigate('/sales')}
          variant="secondary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Cargando...</div>
        </div>
      ) : !venta ? (
        <div className="text-center text-red-600">
          No se encontraron los datos de la venta
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <p className="text-gray-600">
              Fecha: {new Date(venta.fecha_hora).toLocaleString()}
            </p>
            <p className="text-gray-600">
              Vendedor: {venta.Usuario?.nombre || 'N/A'} {venta.Usuario?.apellido || ''}
            </p>
          </div>

          <table className="min-w-full divide-y divide-gray-200 mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detalles.map((detalle, index) => (
                <tr key={detalle.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {detalle.Receta?.nombre || 'Producto no encontrado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="1"
                      value={detalle.cantidad}
                      onChange={(e) => handleCantidadChange(index, parseInt(e.target.value) || 0)}
                      className="w-20 p-1 border rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={detalle.precio_unitario}
                      onChange={(e) => handlePrecioUnitarioChange(index, parseInt(e.target.value) || 0)}
                      className="w-24 p-1 border rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${(detalle.subtotal || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-4 text-right font-bold">
                  Total:
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  ${detalles.reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end space-x-4">
            <Button
              label="Cancelar"
              onClick={() => navigate('/sales')}
              variant="secondary"
            />
            <Button
              label="Guardar Cambios"
              type="submit"
              variant="primary"
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default EditSale; 