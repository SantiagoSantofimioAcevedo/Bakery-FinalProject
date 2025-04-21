import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';

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
  const navigate = useNavigate();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCosto, setEditingCosto] = useState<number>(0);
  const [editingUnidadId, setEditingUnidadId] = useState<number | null>(null);
  const [editingUnidad, setEditingUnidad] = useState<string>('');

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

  // Manejar la edición del costo unitario
  const handleEditCosto = (id: number, costoActual: number) => {
    setEditingId(id);
    setEditingCosto(costoActual);
    // Cerrar cualquier otra edición abierta
    setEditingUnidadId(null);
  };

  // Manejar el cambio en el campo de edición del costo
  const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingCosto(parseFloat(e.target.value) || 0);
  };

  // Guardar el nuevo costo unitario
  const handleSaveCosto = async (id: number) => {
    try {
      if (editingCosto < 0) {
        setError('El costo unitario no puede ser negativo');
        return;
      }

      const materiaPrima = materiasPrimas.find(mp => mp.id === id);
      if (!materiaPrima) return;

      await api.put(`/api/materias-primas/${id}`, {
        ...materiaPrima,
        costo_unitario: editingCosto
      });

      // Actualizar el estado local con el nuevo costo
      setMateriasPrimas(materiasPrimas.map(mp => 
        mp.id === id ? { ...mp, costo_unitario: editingCosto, fecha_ultima_actualizacion: new Date().toISOString() } : mp
      ));

      // Salir del modo edición
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el costo');
      console.error(err);
    }
  };

  // Cancelar la edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingUnidadId(null);
  };
  
  // Manejar la edición de la unidad de medida
  const handleEditUnidad = (id: number, unidadActual: string) => {
    setEditingUnidadId(id);
    setEditingUnidad(unidadActual);
    // Cerrar cualquier otra edición abierta
    setEditingId(null);
  };
  
  // Manejar el cambio en el campo de edición de la unidad
  const handleUnidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditingUnidad(e.target.value);
  };
  
  // Guardar la nueva unidad de medida
  const handleSaveUnidad = async (id: number) => {
    try {
      if (!editingUnidad) {
        setError('Debe seleccionar una unidad de medida');
        return;
      }
      
      const materiaPrima = materiasPrimas.find(mp => mp.id === id);
      if (!materiaPrima) return;
      
      await api.put(`/api/materias-primas/${id}`, {
        ...materiaPrima,
        unidad_medida: editingUnidad
      });
      
      // Actualizar el estado local con la nueva unidad
      setMateriasPrimas(materiasPrimas.map(mp => 
        mp.id === id ? { ...mp, unidad_medida: editingUnidad, fecha_ultima_actualizacion: new Date().toISOString() } : mp
      ));
      
      // Salir del modo edición
      setEditingUnidadId(null);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la unidad de medida');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    try {
      const url = `/api/materias-primas`;
      
      const response = await api.post(url, formData);
      const data = response.data;
      
      setMateriasPrimas([...materiasPrimas, data]);
      
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
      console.error(err);
    }
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
        <div className="flex gap-2">
          <Button
            label="Registrar Nuevo Ingreso"
            variant="primary"
            onClick={() => navigate('/inventory/incoming')}
          />
          <Button
            label="Agregar Materia Prima"
            variant="primary"
            onClick={() => setShowModal(true)}
          />
        </div>
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
                Costo por Kilo
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
                    {new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(item.cantidad_stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUnidadId === item.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={editingUnidad}
                          onChange={handleUnidadChange}
                          className="w-32 py-1 px-2 border border-gray-300 rounded text-sm"
                        >
                          {UNIDADES_MEDIDA.map((unidad) => (
                            <option key={unidad} value={unidad}>
                              {unidad}
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleSaveUnidad(item.id)}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Guardar"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center cursor-pointer hover:text-blue-600"
                        onClick={() => handleEditUnidad(item.id, item.unidad_medida)}
                      >
                        {item.unidad_medida}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editingCosto}
                          onChange={handleCostoChange}
                          className="w-24 py-1 px-2 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                        />
                        <button 
                          onClick={() => handleSaveCosto(item.id)}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Guardar"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center cursor-pointer hover:text-blue-600"
                        onClick={() => handleEditCosto(item.id, item.costo_unitario)}
                      >
                        ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(item.costo_unitario)}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(item.umbral_minimo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.fecha_ultima_actualizacion).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Button
                        label="Eliminar"
                        variant="danger"
                        onClick={() => handleDelete(item.id)}
                      />
                    </div>
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
              'Agregar Materia Prima'
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
                  Costo por kilo
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
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onClick={resetForm}
                />
                <Button
                  label="Agregar"
                  variant="primary"
                  type="submit"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;