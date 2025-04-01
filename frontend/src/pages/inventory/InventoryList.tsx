import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// Definir las unidades de medida disponibles
const UNIDADES_MEDIDA = [
  'Kilogramos (kg)',
  'Gramos (g)',
  'Libras (lb)',
  'Litros (L)',
  'Mililitros (ml)',
  'Unidades (u)',
  'Onzas (oz)',
  'Tazas',
  'Cucharadas',
  'Cucharaditas'
];

interface MateriaPrima {
  id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_stock: number;
  costo_unitario: number;
  umbral_minimo: number;
  fecha_ultima_actualizacion: string;
}

const InventoryList: React.FC = () => {
  const { token } = useAuth();
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<MateriaPrima>>({
    nombre: '',
    unidad_medida: '',
    cantidad_stock: 0,
    costo_unitario: 0,
    umbral_minimo: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar materias primas
  useEffect(() => {
    const fetchMateriasPrimas = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const response = await api.get('/api/materias-primas');
        setMateriasPrimas(response.data);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al cargar el inventario');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMateriasPrimas();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'nombre' || name === 'unidad_medida' ? value : parseFloat(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    try {
      const url = editMode 
        ? `/api/materias-primas/${editId}` 
        : '/api/materias-primas';
      
      const method = editMode ? 'put' : 'post';
      
      const response = await api[method](url, formData);
      const data = response.data;
      
      if (editMode) {
        setMateriasPrimas(materiasPrimas.map(item => item.id === editId ? data : item));
      } else {
        setMateriasPrimas([...materiasPrimas, data]);
      }
      
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
      console.error(err);
    }
  };

  const handleEdit = (materia: MateriaPrima) => {
    setFormData({
      nombre: materia.nombre,
      unidad_medida: materia.unidad_medida,
      cantidad_stock: materia.cantidad_stock,
      costo_unitario: materia.costo_unitario,
      umbral_minimo: materia.umbral_minimo,
    });
    setEditMode(true);
    setEditId(materia.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta materia prima?')) return;
    
    if (!token) return;

    try {
      await api.delete(`/api/materias-primas/${id}`);
      setMateriasPrimas(materiasPrimas.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al eliminar');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      unidad_medida: '',
      cantidad_stock: 0,
      costo_unitario: 0,
      umbral_minimo: 0,
    });
    setEditMode(false);
    setEditId(null);
    setShowModal(false);
  };

  // Filtrar materias primas por término de búsqueda
  const filteredMateriasPrimas = materiasPrimas.filter(
    (item) => item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventario de Materias Primas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Materia Prima
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="sr-only">Cerrar</span>
            <span>&times;</span>
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar materia prima..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad en Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidad de Medida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo Unitario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Umbral Mínimo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Actualización
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMateriasPrimas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron materias primas
                </td>
              </tr>
            ) : (
              filteredMateriasPrimas.map((item) => (
                <tr key={item.id} className={item.cantidad_stock < item.umbral_minimo ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.nombre}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    item.cantidad_stock < item.umbral_minimo ? 'text-red-600 font-bold' : 'text-gray-500'
                  }`}>
                    {item.cantidad_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.costo_unitario.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.umbral_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.fecha_ultima_actualizacion).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para agregar/editar materia prima */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? 'Editar Materia Prima' : 'Agregar Materia Prima'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="unidad_medida">
                  Unidad de Medida
                </label>
                <select
                  id="unidad_medida"
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Seleccione una unidad</option>
                  {UNIDADES_MEDIDA.map((unidad) => (
                    <option key={unidad} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cantidad_stock">
                  Cantidad en Stock
                </label>
                <input
                  type="number"
                  id="cantidad_stock"
                  name="cantidad_stock"
                  value={formData.cantidad_stock}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="costo_unitario">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  id="costo_unitario"
                  name="costo_unitario"
                  value={formData.costo_unitario}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="umbral_minimo">
                  Umbral Mínimo
                </label>
                <input
                  type="number"
                  id="umbral_minimo"
                  name="umbral_minimo"
                  value={formData.umbral_minimo}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {editMode ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;