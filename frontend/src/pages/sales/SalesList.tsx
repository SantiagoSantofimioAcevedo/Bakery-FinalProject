import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSales, deleteSale } from '../../services/salesService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

interface DetalleVenta {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  RecetumId?: number;
  RecetaId?: number;
  Receta?: {
    id: number;
    nombre: string;
    precio_venta: number;
  };
  Recetum?: {
    id: number;
    nombre: string;
    precio_venta: number;
  };
}

interface Venta {
  id: number;
  fecha_hora: string;
  DetalleVentas?: DetalleVenta[];
  DetalleVenta?: DetalleVenta[];
  Usuario: {
    id: number;
    nombre: string;
    apellido: string;
    usuario: string;
  };
  total: number;
}

// Actualizar la interfaz TableColumn para que sea más flexible
interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T, index: number) => React.ReactNode);
}

const SalesList: React.FC = () => {
  const [sales, setSales] = useState<Venta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getSales();
      
      // Agregar logs para ver los datos
      console.log("Datos recibidos del backend:", data);
      if (data && data.length > 0) {
        console.log("Primera venta:", data[0]);
        console.log("DetalleVentas de la primera venta:", data[0].DetalleVentas);
        console.log("Total de la primera venta:", data[0].total);
      }
      
      setSales(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el registro de ventas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSales();
  }, []);

  const handleDeleteSale = async (id: number) => {
    if (!window.confirm('¿Está seguro que desea eliminar esta venta?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteSale(id);
      setSuccessMessage('Venta eliminada correctamente');
      
      // Actualizar la lista de ventas
      await fetchSales();
    } catch (err) {
      setError('Error al eliminar la venta');
      console.error(err);
    } finally {
      setLoading(false);
      
      // Limpiar el mensaje de éxito después de 3 segundos
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  };
  
  useEffect(() => {
    // Después de recibir los datos de ventas, imprimir en consola para depuración
    if (sales.length > 0) {
      console.log("Datos de ventas procesados:", sales);
      console.log("Primera venta:", sales[0]);
      console.log("Detalles de venta:", sales[0].DetalleVenta || sales[0].DetalleVentas || []);
    }
  }, [sales]);
  
  const getDetallesVenta = (sale: Venta) => {
    return sale.DetalleVentas || sale.DetalleVenta || [];
  };
  
  // Fix the columns definition with proper typing
  const columns: TableColumn<Venta>[] = [
    { header: 'ID', accessor: 'id' as keyof Venta },
    {
      header: 'Fecha y Hora',
      accessor: (sale: Venta) => formatDate(sale.fecha_hora)
    },
    {
      header: 'Vendedor',
      accessor: (sale: Venta) => {
        if (!sale.Usuario) return 'Usuario no disponible';
        return `${sale.Usuario.nombre} ${sale.Usuario.apellido}`;
      }
    },
    {
      header: 'Productos',
      accessor: (sale: Venta) => {
        // Intentar obtener detalles de venta de cualquiera de los dos campos posibles
        const detalles = sale.DetalleVentas || sale.DetalleVenta || [];
        
        // Si no hay detalles, mostrar un mensaje claro
        if (!detalles || detalles.length === 0) {
          return (
            <div className="text-red-500">
              No hay productos registrados
            </div>
          );
        }
        
        // Si hay detalles, mostrarlos con toda la información disponible
        return (
          <div className="max-h-20 overflow-y-auto">
            {detalles.map((detalle, index) => {
              // Obtener el nombre del producto
              const nombreProducto = detalle.Receta?.nombre || detalle.Recetum?.nombre;
              
              return (
                <div key={index} className="mb-1">
                  {nombreProducto ? (
                    <span>{detalle.cantidad} x {nombreProducto}</span>
                  ) : (
                    <span className="text-red-500">Producto no encontrado</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'Total',
      accessor: (sale: Venta) => {
        // Si el total es cero, mostrar un mensaje informativo
        if (!sale.total || sale.total === 0) {
          return <span className="text-red-500">$0.00 (Sin productos)</span>;
        }
        return formatCurrency(sale.total);
      }
    },
    {
      header: 'Acciones',
      accessor: (sale: Venta) => (
        <div className="flex space-x-3">
          <Link
            to={`/sales/edit/${sale.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Editar
          </Link>
          <button
            onClick={() => handleDeleteSale(sale.id)}
            className="text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Registro de Ventas</h1>
        <div className="flex gap-2">
          <Link to="/sales/new">
            <Button label="Nueva Venta" variant="primary" />
          </Link>
        </div>
      </div>
      
      {error && <Alert message={error} type="error" className="mb-4" />}
      {successMessage && <Alert message={successMessage} type="success" className="mb-4" />}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={sales as any[]}
          emptyMessage="No hay registros de ventas disponibles"
        />
      )}
    </div>
  );
};

export default SalesList;