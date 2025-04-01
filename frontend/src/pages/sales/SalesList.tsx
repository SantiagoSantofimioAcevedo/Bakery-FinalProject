import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSales } from '../../services/salesService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

interface DetalleVenta {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  receta: {
    nombre: string;
  };
}

interface Venta {
  id: number;
  fecha_hora: string;
  detalles: DetalleVenta[];
  usuario: {
    nombre: string;
    apellido: string;
  };
  total: number;
}

// Add TableColumn interface to match your Table component definition
interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T, index: number) => React.ReactNode);
}

const SalesList: React.FC = () => {
  const [sales, setSales] = useState<Venta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await getSales();
        setSales(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar el registro de ventas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };
  
  // Fix the columns definition with proper typing
  const columns: TableColumn<Venta>[] = [
    { header: 'ID', accessor: 'id' as keyof Venta },
    {
      header: 'Fecha y Hora',
      accessor: (sale: Venta) => {
        const date = new Date(sale.fecha_hora);
        return date.toLocaleString('es-ES');
      }
    },
    {
      header: 'Vendedor',
      accessor: (sale: Venta) =>
        `${sale.usuario.nombre} ${sale.usuario.apellido}`
    },
    {
      header: 'Productos',
      accessor: (sale: Venta) => sale.detalles.length
    },
    {
      header: 'Total',
      accessor: (sale: Venta) => formatCurrency(sale.total)
    },
    {
      header: 'Acciones',
      accessor: (sale: Venta) => (
        <Link
          to={`/sales/${sale.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Ver detalles
        </Link>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Registro de Ventas</h1>
        <Link to="/sales/new">
          <Button label="Nueva Venta" variant="primary" />
        </Link>
      </div>
      
      {error && <Alert message={error} type="error" className="mb-4" />}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={sales}
          emptyMessage="No hay registros de ventas disponibles"
        />
      )}
    </div>
  );
};

export default SalesList;