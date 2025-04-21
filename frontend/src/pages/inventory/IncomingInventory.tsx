import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import { registrarIngreso, obtenerTodosLosIngresos, editarIngreso, eliminarIngreso } from '../../services/ingresoService';
import { MateriaPrima, IngresoMateriaPrima } from '../../types/inventory';
import api from '../../services/api';

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

interface FormData {
  MateriaPrimaId: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
  costo_total: number;
  proveedor: string;
  numero_factura: string;
  observaciones: string;
}

const IncomingInventory: React.FC = () => {
  const [incomingItems, setIncomingItems] = useState<IngresoMateriaPrima[]>([]);
  const [filteredItems, setFilteredItems] = useState<IngresoMateriaPrima[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IngresoMateriaPrima | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [proveedorFiltro, setProveedorFiltro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: 'fecha_ingreso' | 'costo_unitario' | 'costo_total';
    direction: 'asc' | 'desc';
  } | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    MateriaPrimaId: '',
    cantidad: 0,
    unidad_medida: '',
    costo_unitario: 0,
    costo_total: 0,
    proveedor: '',
    numero_factura: '',
    observaciones: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ingresosResponse, materiasResponse] = await Promise.all([
          obtenerTodosLosIngresos(),
          api.get('/api/materias-primas')
        ]);
 
        setIncomingItems(ingresosResponse);
        setFilteredItems(ingresosResponse);
        setMateriasPrimas(materiasResponse.data);
      } catch (err: any) {
        console.error('Error al cargar los datos:', err);
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...incomingItems];

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter(item => 
        item.MateriaPrima?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros de fecha
    if (fechaInicio || fechaFin) {
      result = result.filter(item => {
        const itemDate = new Date(item.fecha_ingreso);
        const startDate = fechaInicio ? new Date(fechaInicio) : null;
        const endDate = fechaFin ? new Date(fechaFin) : null;

        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    }

    // Aplicar ordenamiento
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'fecha_ingreso') {
          const dateA = new Date(a.fecha_ingreso).getTime();
          const dateB = new Date(b.fecha_ingreso).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          const valueA = a[sortConfig.key];
          const valueB = b[sortConfig.key];
          return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
      });
    }

    setFilteredItems(result);
  }, [incomingItems, searchTerm, fechaInicio, fechaFin, sortConfig]);

  const handleSort = (key: 'fecha_ingreso' | 'costo_unitario' | 'costo_total') => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: 'fecha_ingreso' | 'costo_unitario' | 'costo_total') => {
    if (!sortConfig || sortConfig.key !== key) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleMateriaPrimaChange = (materiaPrimaId: string) => {
    const materiaPrimaSeleccionada = materiasPrimas.find(mp => mp.id.toString() === materiaPrimaId);
    
    if (materiaPrimaSeleccionada) {
      setFormData(prev => ({
        ...prev,
        MateriaPrimaId: materiaPrimaId,
        costo_unitario: materiaPrimaSeleccionada.costo_unitario || 0,
        unidad_medida: materiaPrimaSeleccionada.unidad_medida || '',
        costo_total: prev.cantidad > 0 
          ? prev.cantidad * (materiaPrimaSeleccionada.costo_unitario || 0) 
          : 0
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'MateriaPrimaId') {
      handleMateriaPrimaChange(value);
      return;
    }
    
    setFormData(prev => {
      const updatedForm = {
        ...prev,
        [name]: name === 'cantidad' || name === 'costo_unitario' || name === 'costo_total' 
          ? parseFloat(value) || 0 
          : value
      };
      
      if (name === 'costo_total') {
        if (updatedForm.cantidad > 0) {
          updatedForm.costo_unitario = updatedForm.costo_total / updatedForm.cantidad;
        }
      } else if (name === 'cantidad') {
        if (updatedForm.costo_total === 0 || prev.cantidad === 0) {
          updatedForm.costo_total = updatedForm.cantidad * updatedForm.costo_unitario;
        } else {
          updatedForm.costo_unitario = updatedForm.costo_total / updatedForm.cantidad;
        }
      }
      
      return updatedForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Enviando datos del formulario:', formData);
      const response = await registrarIngreso({
        ...formData,
        MateriaPrimaId: parseInt(formData.MateriaPrimaId)
      });
      
      const nuevosIngresos = await obtenerTodosLosIngresos();
      console.log('Nuevos ingresos cargados:', nuevosIngresos);
      setIncomingItems(nuevosIngresos);
      setFilteredItems(nuevosIngresos);
      
      setShowModal(false);
      setFormData({
        MateriaPrimaId: '',
        cantidad: 0,
        unidad_medida: '',
        costo_unitario: 0,
        costo_total: 0,
        proveedor: '',
        numero_factura: '',
        observaciones: ''
      });
    } catch (err: any) {
      console.error('Error al registrar:', err);
      setError(err.message || 'Error al registrar el ingreso');
    }
  };

  const handleEdit = (item: IngresoMateriaPrima) => {
    setSelectedItem(item);
    setFormData({
      MateriaPrimaId: item.MateriaPrimaId.toString(),
      cantidad: item.cantidad,
      unidad_medida: item.unidad_medida,
      costo_unitario: item.costo_unitario,
      costo_total: item.costo_total,
      proveedor: item.proveedor,
      numero_factura: item.numero_factura || '',
      observaciones: item.observaciones || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      await editarIngreso(selectedItem.id, {
        ...formData,
        MateriaPrimaId: parseInt(formData.MateriaPrimaId)
      });
      
      const nuevosIngresos = await obtenerTodosLosIngresos();
      setIncomingItems(nuevosIngresos);
      setFilteredItems(nuevosIngresos);
      
      setShowEditModal(false);
      setSelectedItem(null);
      setFormData({
        MateriaPrimaId: '',
        cantidad: 0,
        unidad_medida: '',
        costo_unitario: 0,
        costo_total: 0,
        proveedor: '',
        numero_factura: '',
        observaciones: ''
      });
    } catch (err: any) {
      setError(err.message || 'Error al editar el ingreso');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este ingreso? Esta acción actualizará el inventario.')) {
      try {
        await eliminarIngreso(id);
        
        const nuevosIngresos = await obtenerTodosLosIngresos();
        setIncomingItems(nuevosIngresos);
        setFilteredItems(nuevosIngresos);
      } catch (err: any) {
        setError(err.message || 'Error al eliminar el ingreso');
      }
    }
  };

  const handleFilter = async () => {
    try {
      const ingresos = await obtenerTodosLosIngresos(
        fechaInicio,
        fechaFin,
        proveedorFiltro
      );
      setIncomingItems(ingresos);
      setFilteredItems(ingresos);
    } catch (err: any) {
      setError(err.message || 'Error al filtrar los ingresos');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFechaInicio('');
    setFechaFin('');
    setSortConfig(null);
    setFilteredItems(incomingItems);
  };

  const resetForm = () => {
    setFormData({
      MateriaPrimaId: '',
      cantidad: 0,
      unidad_medida: '',
      costo_unitario: 0,
      costo_total: 0,
      proveedor: '',
      numero_factura: '',
      observaciones: ''
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Registro de Ingresos de Inventario</h1>
        <Button
          label="Registrar Nuevo"
          variant="primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="text-sm px-4 py-2"
        />
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

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre o proveedor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            label="Limpiar Filtros"
            variant="secondary"
            onClick={handleClearFilters}
            className="text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('fecha_ingreso')}
              >
                Fecha {getSortIcon('fecha_ingreso')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materia Prima
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('costo_unitario')}
              >
                Precio por Kilo {getSortIcon('costo_unitario')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('costo_total')}
              >
                Costo Total {getSortIcon('costo_total')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registrado Por
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observaciones
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                  No hay registros de ingresos
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm">
                    {new Date(item.fecha_ingreso).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {item.MateriaPrima?.nombre || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {item.cantidad} {item.unidad_medida}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    ${new Intl.NumberFormat('es-CO').format(item.costo_unitario)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    ${new Intl.NumberFormat('es-CO').format(item.costo_total)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {item.proveedor}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {item.Usuario ? `${item.Usuario.nombre} ${item.Usuario.apellido}` : 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {item.observaciones || 'Sin observaciones'}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Registrar Nuevo Ingreso</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Materia Prima
                </label>
                <select
                  name="MateriaPrimaId"
                  value={formData.MateriaPrimaId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Seleccione una materia prima</option>
                  {materiasPrimas.map((mp) => (
                    <option key={mp.id} value={mp.id}>
                      {mp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unidad de Medida
                </label>
                <input
                  type="text"
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  La unidad de medida está asociada a la materia prima seleccionada
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Costo Total
                </label>
                <input
                  type="number"
                  name="costo_total"
                  value={formData.costo_total}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  min="0.01"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese el valor total incluyendo impuestos, envíos, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proveedor
                </label>
                <input
                  type="text"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Factura
                </label>
                <input
                  type="text"
                  name="numero_factura"
                  value={formData.numero_factura}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <input
                  type="text"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                />
                <Button
                  label="Guardar"
                  variant="primary"
                  type="submit"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow max-w-md w-full overflow-y-auto max-h-screen">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Editar Ingreso</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                  resetForm();
                }}
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-4 py-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Materia Prima</label>
                <select
                  name="MateriaPrimaId"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={formData.MateriaPrimaId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>Seleccione una materia prima</option>
                  {materiasPrimas.map(mp => (
                    <option key={mp.id} value={mp.id}>
                      {mp.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                <input
                  type="text"
                  name="unidad_medida"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-gray-100 rounded-md text-gray-900 text-sm"
                  value={formData.unidad_medida}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  La unidad de medida está asociada a la materia prima seleccionada
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  name="cantidad"
                  min="0.01"
                  step="0.01"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Costo Total</label>
                <input
                  type="number"
                  name="costo_total"
                  min="0.01"
                  step="0.01"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={formData.costo_total}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el valor total incluyendo impuestos, envíos, etc.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <input
                  type="text"
                  name="proveedor"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={formData.proveedor}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de Factura</label>
                <input
                  type="text"
                  name="numero_factura"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={formData.numero_factura}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <input
                  type="text"
                  name="observaciones"
                  className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  label="Cancelar"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                    resetForm();
                  }}
                  className="mr-2"
                />
                <Button
                  type="submit"
                  label="Guardar Cambios"
                  variant="primary"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingInventory; 