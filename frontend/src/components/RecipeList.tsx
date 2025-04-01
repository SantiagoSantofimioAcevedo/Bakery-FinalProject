import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Receta, MateriaPrima, FormData, RecetaIngrediente } from '../types';

const RecipeList: React.FC = () => {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Receta | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    tiempo_preparacion: 0,
    tiempo_horneado: 0,
    temperatura: 0,
    instrucciones: '',
    precio_venta: 0,
    imagen: null,
    ingredientes: []
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recetasResponse, materiasResponse] = await Promise.all([
          fetch(`${API_URL}/recetas`),
          fetch(`${API_URL}/materias-primas`)
        ]);

        if (!recetasResponse.ok || !materiasResponse.ok) {
          throw new Error('Error al cargar los datos');
        }

        const recetasData = await recetasResponse.json();
        const materiasData = await materiasResponse.json();

        setRecetas(recetasData);
        setMateriasPrimas(materiasData);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      setRecetas([]);
      setMateriasPrimas([]);
      setCurrentRecipe(null);
      setShowForm(false);
    };
  }, []);

  const handleEdit = async (id: number) => {
    if (!id) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(`${API_URL}/recetas/${id}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Error al obtener la receta');
      
      const data = await response.json();
      
      // Asegurarse de que los valores numéricos sean números válidos
      setFormData({
        ...data,
        tiempo_preparacion: Number(data.tiempo_preparacion) || 0,
        tiempo_horneado: Number(data.tiempo_horneado) || 0,
        temperatura: Number(data.temperatura) || 0,
        precio_venta: Number(data.precio_venta) || 0,
        ingredientes: data.MateriaPrima?.map((ing: MateriaPrima) => ({
          id: ing.id,
          cantidad: Number(ing.RecetaIngrediente?.cantidad) || 0,
          unidad_medida: ing.RecetaIngrediente?.unidad_medida || ''
        })) || []
      });
      
      setCurrentRecipe(data);
      setShowForm(true);
    } catch (error) {
      console.error('Error al cargar la receta:', error);
      if (error instanceof Error) {
        alert(`Error al cargar la receta: ${error.message}`);
      } else {
        alert('Error al cargar la receta');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;
    
    try {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'file' 
          ? target.files?.[0] || null 
          : type === 'number'
            ? value === '' ? 0 : Number(value)
            : value
      }));
    } catch (error) {
      console.error('Error al actualizar el formulario:', error);
    }
  };

  const handleIngredienteChange = (index: number, field: string, value: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        ingredientes: prev.ingredientes.map((ing: RecetaIngrediente, i: number) => 
          i === index ? { ...ing, [field]: value } : ing
        )
      }));
    } catch (error) {
      console.error('Error al actualizar ingrediente:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar envío del formulario
  };

  return (
    <div className="container mt-4">
      {showForm && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">
              {currentRecipe ? 'Editar Receta' : 'Nueva Receta'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Tiempo de Preparación (minutos)</label>
                <input
                  type="number"
                  name="tiempo_preparacion"
                  value={String(formData.tiempo_preparacion)}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  step="1"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Tiempo de Horneado (minutos)</label>
                <input
                  type="number"
                  name="tiempo_horneado"
                  value={String(formData.tiempo_horneado)}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  step="1"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Temperatura (°C)</label>
                <input
                  type="number"
                  name="temperatura"
                  value={String(formData.temperatura)}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  step="1"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Precio de Venta</label>
                <input
                  type="number"
                  name="precio_venta"
                  value={String(formData.precio_venta)}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  step="0.01"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeList; 