import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProductions } from '../../services/productionService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

interface Production {
  id: number;
  RecetaId: number;
  cantidad: number;
  fecha_hora: string;
  Usuario: {
    id: number;
    nombre: string;
    apellido: string;
    usuario: string;
  };
  Recetum: {
    id: number;
    nombre: string;
    descripcion: string;
  } | null;
}

const ProductionList: React.FC = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        setLoading(true);
        const data = await getProductions();
        console.log('Producciones recibidas:', data);
        setProductions(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar el registro de producción');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductions();
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Production },
    {
      header: 'Producto',
      accessor: (production: Production) => {
        console.log('Datos de producción:', production);
        if (production.Recetum) {
          return production.Recetum.nombre;
        }
        return 'Sin receta';
      }
    },
    { header: 'Cantidad', accessor: 'cantidad' as keyof Production },
    {
      header: 'Fecha y Hora',
      accessor: (production: Production) => {
        const date = new Date(production.fecha_hora);
        return date.toLocaleString('es-ES');
      }
    },
    {
      header: 'Responsable',
      accessor: (production: Production) =>
        production.Usuario ? `${production.Usuario.nombre} ${production.Usuario.apellido}` : 'Sin información'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Registro de Producción</h1>
        <div className="space-x-4">
          <Link to="/production/daily">
            <Button label="Producción de Hoy" variant="secondary" />
          </Link>
          <Link to="/production/weekly">
            <Button label="Producción Semanal" variant="secondary" />
          </Link>
          <Link to="/production/start">
            <Button label="Iniciar Producción" variant="primary" />
          </Link>
        </div>
      </div>

      {error && <Alert message={error} type="error" className="mb-4" />}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={productions}
          emptyMessage="No hay registros de producción disponibles"
        />
      )}
    </div>
  );
};

export default ProductionList;