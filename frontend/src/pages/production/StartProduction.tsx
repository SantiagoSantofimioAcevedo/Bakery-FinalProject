import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../../services/recipeService';
import { createProduction, checkInventoryForRecipe } from '../../services/productionService';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';

interface Recipe {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
}

interface InventoryCheck {
  sufficient: boolean;
  missingIngredients?: Array<{
    nombre: string;
    cantidad_requerida: number;
    cantidad_disponible: number;
    unidad_medida: string;
  }>;
}

const StartProduction: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryCheck, setInventoryCheck] = useState<InventoryCheck | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await getRecipes();
        setRecipes(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar las recetas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setInventoryCheck(null);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
      setInventoryCheck(null);
    }
  };

  const handleCheckInventory = async () => {
    if (!selectedRecipe) return;

    try {
      setLoading(true);
      const checkResult = await checkInventoryForRecipe(selectedRecipe.id, quantity);
      setInventoryCheck(checkResult);
      setError(null);
    } catch (err) {
      setError('Error al verificar el inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async () => {
    if (!selectedRecipe) return;

    try {
      setSubmitting(true);
      await createProduction({
        recetaId: selectedRecipe.id,
        cantidad: quantity
      });
      navigate('/production', { state: { success: true, message: 'Producción iniciada correctamente' } });
    } catch (err) {
      setError('Error al iniciar la producción');
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Iniciar Producción</h1>

      {error && <Alert message={error} type="error" className="mb-4" />}

      {!selectedRecipe ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Selecciona una receta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                title={recipe.nombre}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSelectRecipe(recipe)}
              >
                {recipe.imagen && (
                  <img 
                    src={recipe.imagen} 
                    alt={recipe.nombre} 
                    className="w-full h-48 object-cover rounded-t"
                  />
                )}
                <p className="text-gray-600 mt-2">{recipe.descripcion}</p>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Receta seleccionada:</h2>
            <div className="flex items-center">
              {selectedRecipe.imagen && (
                <img 
                  src={selectedRecipe.imagen} 
                  alt={selectedRecipe.nombre} 
                  className="w-16 h-16 object-cover rounded mr-4"
                />
              )}
              <div>
                <div className="font-medium">{selectedRecipe.nombre}</div>
                <button 
                  onClick={() => setSelectedRecipe(null)} 
                  className="text-blue-600 text-sm hover:underline"
                >
                  Cambiar selección
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Cantidad a producir:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {inventoryCheck && !inventoryCheck.sufficient && (
            <Alert 
              type="warning" 
              className="mb-4"
              message={
                <div>
                  <p className="font-medium">Inventario insuficiente para producir esta cantidad:</p>
                  <ul className="mt-2 list-disc pl-5">
                    {inventoryCheck.missingIngredients?.map((ingredient, idx) => (
                      <li key={idx}>
                        {ingredient.nombre}: Necesita {ingredient.cantidad_requerida} {ingredient.unidad_medida}, 
                        disponible {ingredient.cantidad_disponible} {ingredient.unidad_medida}
                      </li>
                    ))}
                  </ul>
                </div>
              }
            />
          )}

          {inventoryCheck && inventoryCheck.sufficient && (
            <Alert 
              type="success" 
              className="mb-4"
              message="Hay suficientes ingredientes disponibles para iniciar la producción"
            />
          )}

          <div className="flex space-x-4">
            {!inventoryCheck && (
              <Button 
                label="Verificar Inventario" 
                variant="secondary" 
                onClick={handleCheckInventory} 
                disabled={submitting || loading}
              />
            )}
            
            <Button 
                label="Iniciar Producción" 
                variant="primary" 
                onClick={handleStartProduction} 
                disabled={Boolean(submitting || loading || (inventoryCheck && !inventoryCheck.sufficient))}
                />
          </div>
        </div>
      )}
    </div>
  );
};

export default StartProduction;