import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface RecetaIngrediente {
  cantidad: number;
  unidad_medida: string;
}

interface MateriaPrima {
  id: number;
  nombre: string;
  unidad_medida: string;
  RecetaIngrediente?: RecetaIngrediente;
}

interface FormIngrediente {
  id: number;
  nombre?: string;
  cantidad: number;
  unidad_medida: string;
}

interface Receta {
  id: number;
  nombre: string;
  descripcion: string;
  tiempo_preparacion: number;
  tiempo_horneado: number;
  temperatura: number;
  instrucciones: string;
  precio_venta: number;
  imagen?: string;
  imagen_url?: string;
  MateriaPrima?: MateriaPrima[];
}

interface FormData extends Omit<Partial<Receta>, 'ingredientes'> {
  ingredientes: FormIngrediente[];
}

const RecipeList: React.FC = () => {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Receta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    tiempo_preparacion: 0,
    tiempo_horneado: 0,
    temperatura: 0,
    instrucciones: '',
    precio_venta: 0,
    ingredientes: [],
  });
  
  const [newIngredient, setNewIngredient] = useState<FormIngrediente>({
    id: 0,
    cantidad: 0,
    unidad_medida: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Cargar recetas
  useEffect(() => {
    const fetchRecetas = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const response = await api.get('/api/recetas');
        setRecetas(response.data);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al cargar las recetas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecetas();
  }, [token]);

  // Cargar materias primas para usar en el formulario
  useEffect(() => {
    const fetchMateriasPrimas = async () => {
      if (!token) return;

      try {
        const response = await api.get('/api/materias-primas');
        setMateriasPrimas(response.data);
      } catch (err: any) {
        console.error('Error al cargar materias primas:', err);
      }
    };

    fetchMateriasPrimas();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (['tiempo_preparacion', 'tiempo_horneado', 'temperatura', 'precio_venta'].includes(name)) {
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleIngredientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'id') {
      const selectedMateria = materiasPrimas.find(m => m.id === parseInt(value));
      setNewIngredient({
        ...newIngredient,
        id: parseInt(value),
        unidad_medida: selectedMateria ? selectedMateria.unidad_medida : '',
      });
    } else {
      setNewIngredient({
        ...newIngredient,
        [name]: name === 'cantidad' ? parseFloat(value) : value,
      });
    }
  };

  const addIngredient = () => {
    if (newIngredient.id === 0 || newIngredient.cantidad <= 0) {
      alert('Por favor, seleccione un ingrediente y una cantidad válida');
      return;
    }

    const ingrediente: FormIngrediente = {
      id: newIngredient.id,
      cantidad: newIngredient.cantidad,
      unidad_medida: newIngredient.unidad_medida,
      nombre: materiasPrimas.find(m => m.id === newIngredient.id)?.nombre,
    };

    setFormData({
      ...formData,
      ingredientes: [...formData.ingredientes, ingrediente],
    });

    // Resetear form de ingrediente
    setNewIngredient({
      id: 0,
      cantidad: 0,
      unidad_medida: '',
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredientes = [...formData.ingredientes];
    newIngredientes.splice(index, 1);
    setFormData({ ...formData, ingredientes: newIngredientes });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        alert('Por favor, seleccione un archivo de imagen válido');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    if (formData.ingredientes.length === 0) {
      alert('Debe agregar al menos un ingrediente a la receta');
      return;
    }

    try {
      const url = currentRecipe 
        ? `/api/recetas/${currentRecipe.id}` 
        : '/api/recetas';
      
      const method = currentRecipe ? 'put' : 'post';
      
      // Preparar los datos en formato JSON
      const recetaData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || '',
        tiempo_preparacion: formData.tiempo_preparacion || 0,
        tiempo_horneado: formData.tiempo_horneado || 0,
        temperatura: formData.temperatura || 0,
        instrucciones: formData.instrucciones || '',
        precio_venta: formData.precio_venta || 0,
        ingredientes: formData.ingredientes.map(ing => ({
          id: ing.id,
          cantidad: ing.cantidad,
          unidad_medida: ing.unidad_medida
        }))
      };

      // Si hay una imagen, usar FormData
      if (selectedImage) {
        const formDataToSend = new FormData();
        
        // Agregar la imagen
        formDataToSend.append('imagen', selectedImage);
        
        // Agregar los datos de la receta como JSON string
        formDataToSend.append('receta', JSON.stringify(recetaData));

        const response = await api[method](url, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const data = response.data;
        if (currentRecipe) {
          setRecetas(recetas.map(r => r.id === currentRecipe.id ? data : r));
        } else {
          setRecetas([...recetas, data]);
        }
      } else {
        // Si no hay imagen, enviar solo los datos JSON
        const response = await api[method](url, recetaData);
        const data = response.data;
        if (currentRecipe) {
          setRecetas(recetas.map(r => r.id === currentRecipe.id ? data : r));
        } else {
          setRecetas([...recetas, data]);
        }
      }
      
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
      console.error(err);
    }
  };

  const handleEdit = (receta: Receta) => {
    // Asegurarse de que los valores numéricos sean números válidos
    setFormData({
      nombre: receta.nombre,
      descripcion: receta.descripcion,
      tiempo_preparacion: receta.tiempo_preparacion || 0,
      tiempo_horneado: receta.tiempo_horneado || 0,
      temperatura: receta.temperatura || 0,
      instrucciones: receta.instrucciones,
      precio_venta: receta.precio_venta || 0,
      ingredientes: receta.MateriaPrima?.map(mp => ({
        id: mp.id,
        cantidad: mp.RecetaIngrediente?.cantidad || 0,
        unidad_medida: mp.RecetaIngrediente?.unidad_medida || '',
        nombre: mp.nombre,
      })) || [],
    });
    setCurrentRecipe(receta);
    setViewMode(false);
    setShowModal(true);
  };

  const handleView = async (receta: Receta) => {
    try {
      // Obtener los detalles actualizados de la receta
      const response = await api.get(`/api/recetas/${receta.id}`);
      const recetaData = response.data;
      
      // Asegurarse de que los ingredientes estén presentes
      if (!recetaData.MateriaPrima) {
        recetaData.MateriaPrima = [];
      }
      
      setCurrentRecipe(recetaData);
      setViewMode(true);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles de la receta');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta receta?')) return;
    
    if (!token) return;

    try {
      await api.delete(`/api/recetas/${id}`);
      setRecetas(recetas.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al eliminar');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tiempo_preparacion: 0,
      tiempo_horneado: 0,
      temperatura: 0,
      instrucciones: '',
      precio_venta: 0,
      ingredientes: [],
    });
    setSelectedImage(null);
    setPreviewUrl('');
    setCurrentRecipe(null);
    setShowModal(false);
  };

  // Filtrar recetas por término de búsqueda
  const filteredRecetas = recetas.filter(receta =>
    receta.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando recetas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recetas</h1>
        <button
          onClick={() => {
            setCurrentRecipe(null);
            setViewMode(false);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Nueva Receta
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="sr-only">Cerrar</span>
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar receta..."
          className="px-4 py-2 border rounded-md w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Listado de recetas en formato de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecetas.length === 0 ? (
          <div className="col-span-3 text-center text-gray-500 py-10">
            No se encontraron recetas
          </div>
        ) : (
          filteredRecetas.map((receta) => (
            <div key={receta.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {receta.imagen ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL}/uploads/recetas/${receta.imagen}`}
                    alt={receta.nombre}
                    className="object-cover w-full h-48"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-100">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{receta.nombre}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{receta.descripcion}</p>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <div>Preparación: {receta.tiempo_preparacion} min</div>
                  <div>Horneado: {receta.tiempo_horneado} min</div>
                  <div>{receta.temperatura}°C</div>
                </div>
                
                <div className="text-lg font-bold text-blue-600 mb-4">
                  ${receta.precio_venta.toFixed(2)}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleView(receta)}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(receta)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(receta.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para ver/crear/editar receta */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-90 z-40" />
          <div className="fixed inset-0 z-50">
            <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="inline-block align-bottom bg-white rounded-lg shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                <div className="bg-white rounded-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4">
                    {viewMode ? 'Detalles de Receta' : currentRecipe ? 'Editar Receta' : 'Nueva Receta'}
                  </h2>

                  {viewMode ? (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold">{currentRecipe?.nombre}</h3>
                      
                      {/* Imagen de la receta */}
                      {currentRecipe?.imagen && (
                        <div className="w-full h-64 relative">
                          <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/recetas/${currentRecipe.imagen}`}
                            alt={currentRecipe.nombre}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-700">{currentRecipe?.descripcion}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm text-gray-500">Preparación</div>
                          <div className="font-bold">{currentRecipe?.tiempo_preparacion} min</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm text-gray-500">Horneado</div>
                          <div className="font-bold">{currentRecipe?.tiempo_horneado} min</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm text-gray-500">Temperatura</div>
                          <div className="font-bold">{currentRecipe?.temperatura}°C</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Ingredientes:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {currentRecipe?.MateriaPrima && currentRecipe.MateriaPrima.length > 0 ? (
                            currentRecipe.MateriaPrima.map((ing, idx) => (
                              <li key={idx} className="text-gray-700">
                                {ing.nombre}: {ing.RecetaIngrediente?.cantidad} {ing.RecetaIngrediente?.unidad_medida}
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500">No hay ingredientes registrados</li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Instrucciones:</h4>
                        <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                          {currentRecipe?.instrucciones}
                        </div>
                      </div>
                      
                      <div className="text-xl font-bold text-blue-600">
                        Precio de venta: ${currentRecipe?.precio_venta.toFixed(2)}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        {/* Imagen preview y selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Imagen de la Receta</label>
                          <div
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative cursor-pointer hover:border-blue-400 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <div className="space-y-1 text-center">
                              {previewUrl ? (
                                <div className="mb-4">
                                  <img src={previewUrl} alt="Preview" className="mx-auto h-32 w-auto" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImage(null);
                                      setPreviewUrl('');
                                    }}
                                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                                  >
                                    Eliminar imagen
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                  >
                                    <path
                                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <div className="flex flex-col items-center text-sm text-gray-600">
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      ref={fileInputRef}
                                      className="sr-only"
                                      accept="image/*"
                                      onChange={handleImageChange}
                                    />
                                    <p className="font-medium text-blue-600 hover:text-blue-500">
                                      Haga clic para seleccionar
                                    </p>
                                    <p className="text-gray-500">o arrastre y suelte una imagen aquí</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF hasta 10MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nombre</label>
                          <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Descripción</label>
                          <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tiempo Preparación (min)</label>
                            <input
                              type="number"
                              name="tiempo_preparacion"
                              value={formData.tiempo_preparacion || 0}
                              onChange={handleInputChange}
                              required
                              min="1"
                              step="1"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tiempo Horneado (min)</label>
                            <input
                              type="number"
                              name="tiempo_horneado"
                              value={formData.tiempo_horneado || 0}
                              onChange={handleInputChange}
                              required
                              min="0"
                              step="1"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Temperatura (°C)</label>
                            <input
                              type="number"
                              name="temperatura"
                              value={formData.temperatura || 0}
                              onChange={handleInputChange}
                              required
                              min="0"
                              step="1"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>
                        </div>
                        
                        {/* Sección de ingredientes */}
                        <div className="border p-4 rounded-md bg-gray-50">
                          <h4 className="font-medium mb-3">
                            Ingredientes
                            {formData.ingredientes.length === 0 && (
                              <span className="text-red-500 text-sm ml-1">*</span>
                            )}
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-3 mb-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Materia Prima
                                {formData.ingredientes.length === 0 && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              <select
                                name="id"
                                value={newIngredient.id}
                                onChange={handleIngredientChange}
                                className={`mt-1 block w-full border ${formData.ingredientes.length === 0 ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm p-2`}
                              >
                                <option value="0">Seleccionar...</option>
                                {materiasPrimas.map(mp => (
                                  <option key={mp.id} value={mp.id}>{mp.nombre}</option>
                                ))}
                              </select>
                              {formData.ingredientes.length === 0 && (
                                <p className="mt-1 text-sm text-red-500">Debe agregar al menos un ingrediente</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                              <input
                                type="number"
                                name="cantidad"
                                value={newIngredient.cantidad}
                                onChange={handleIngredientChange}
                                min="0.01"
                                step="0.01"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                              />
                            </div>
                            
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={addIngredient}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                              >
                                Agregar Ingrediente
                              </button>
                            </div>
                          </div>
                          
                          {/* Lista de ingredientes agregados */}
                          {formData.ingredientes.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Ingredientes agregados:</h5>
                              <ul className="divide-y divide-gray-200">
                                {formData.ingredientes.map((ing, index) => (
                                  <li key={index} className="py-2 flex justify-between items-center">
                                    <span>
                                      {ing.nombre}: {ing.cantidad} {ing.unidad_medida}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeIngredient(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      Eliminar
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Instrucciones</label>
                          <textarea
                            name="instrucciones"
                            value={formData.instrucciones}
                            onChange={handleInputChange}
                            rows={5}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Precio de Venta ($)</label>
                          <input
                            type="number"
                            name="precio_venta"
                            value={formData.precio_venta || 0}
                            onChange={handleInputChange}
                            required
                            min="0.01"
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            {currentRecipe ? 'Actualizar' : 'Crear'} Receta
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecipeList;