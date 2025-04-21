import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../../services/recipeService';
import { createSale, SaleItemData } from '../../services/salesService';
import { getProductoDisponible, ProductoDisponible } from '../../services/productionService';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Table from '../../components/common/Table';

interface Recipe {
  id: number;
  nombre: string;
  precio_venta: number;
}

interface CartItem extends SaleItemData {
  nombre: string;
  precio_unitario: number;
  subtotal: number;
}

interface InventarioError {
  receta: string;
  disponible: number;
  solicitado: number;
}

// Import or define the TableColumn type to match your Table component
interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T, index: number) => React.ReactNode);
}

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<ProductoDisponible | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await getRecipes();
        setRecipes(data);
        if (data.length > 0) {
          setSelectedRecipe(data[0].id);
        }
        setError(null);
      } catch (err) {
        setError('Error al cargar los productos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const handleRecipeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const recetaId = parseInt(e.target.value);
    setSelectedRecipe(recetaId);
    
    // Consultar la disponibilidad del producto seleccionado
    try {
      const disponibilidadData = await getProductoDisponible(recetaId);
      setDisponibilidad(disponibilidadData);
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      setDisponibilidad(null);
    }
  };

  const addToCart = () => {
    const recipe = recipes.find(r => r.id === selectedRecipe);
    if (!recipe) return;

    const existingItemIndex = cart.findIndex(item => item.recetaId === selectedRecipe);

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      const updatedQuantity = updatedCart[existingItemIndex].cantidad + quantity;
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        cantidad: updatedQuantity,
        subtotal: recipe.precio_venta * updatedQuantity
      };
      setCart(updatedCart);
    } else {
      // Add new item
      setCart([
        ...cart,
        {
          recetaId: recipe.id,
          nombre: recipe.nombre,
          cantidad: quantity,
          precio_unitario: recipe.precio_venta,
          subtotal: recipe.precio_venta * quantity
        }
      ]);
    }

    setQuantity(1);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('No hay productos en el carrito');
      return;
    }

    try {
      setSubmitting(true);
      const saleData = {
        items: cart.map(item => ({
          recetaId: item.recetaId,
          cantidad: item.cantidad
        }))
      };
      
      console.log("Enviando datos de venta:", JSON.stringify(saleData, null, 2));
      
      await createSale(saleData);
      navigate('/sales', { state: { success: true, message: 'Venta registrada correctamente' } });
    } catch (err: any) {
      console.error('Error al registrar la venta:', err);
      
      // Verificar si es un error de inventario insuficiente
      if (err.response?.data?.errores && Array.isArray(err.response.data.errores)) {
        const errores = err.response.data.errores;
        
        // Construir un mensaje más detallado
        let mensajeError = 'No hay suficiente inventario para completar la venta:\n';
        
        // Añadir detalle de cada producto con inventario insuficiente
        errores.forEach((error: InventarioError) => {
          mensajeError += `- ${error.receta}: disponible ${error.disponible}, solicitado ${error.solicitado}\n`;
        });
        
        setError(mensajeError);
      } else {
        // Si es otro tipo de error, mostrar mensaje genérico o el del servidor
        setError('Error al registrar la venta: ' + (err.response?.data?.message || 'Error desconocido'));
      }
      
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Fixed the type declaration and accessor types
  const cartColumns: TableColumn<CartItem>[] = [
    { header: 'Producto', accessor: 'nombre' as keyof CartItem },
    { header: 'Cantidad', accessor: 'cantidad' as keyof CartItem },
    { 
      header: 'Precio Unitario', 
      accessor: (item: CartItem) => formatCurrency(item.precio_unitario) 
    },
    { 
      header: 'Subtotal', 
      accessor: (item: CartItem) => formatCurrency(item.subtotal) 
    },
    {
      header: 'Acciones',
      accessor: (_: CartItem, index: number) => (
        <button
          onClick={() => removeFromCart(index)}
          className="text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      )
    }
  ];

  if (loading && recipes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Nueva Venta</h1>

      {error && <Alert message={error} type="error" className="mb-4" />}

      <div className="bg-white p-4 rounded shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Agregar Producto</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Producto:</label>
            <select
              value={selectedRecipe}
              onChange={handleRecipeChange}
              className="w-full p-2 border rounded"
              disabled={recipes.length === 0}
            >
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.nombre} - {formatCurrency(recipe.precio_venta)}
                </option>
              ))}
            </select>
            
            {/* Mostrar disponibilidad del producto seleccionado */}
            {disponibilidad && (
              <div className="mt-2 text-sm">
                <p className={disponibilidad.disponible > 0 ? 'text-green-600' : 'text-red-600'}>
                  Disponible: <strong>{disponibilidad.disponible}</strong> unidades
                </p>
                <p className="text-gray-500">
                  (Producido: {disponibilidad.totalProducido}, 
                  Vendido: {disponibilidad.totalVendido})
                </p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Cantidad:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <Button 
              label="Agregar" 
              variant="secondary" 
              onClick={addToCart} 
              disabled={recipes.length === 0}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Detalles de la Venta</h2>
        
        <Table 
          columns={cartColumns} 
          data={cart} 
          emptyMessage="No hay productos en el carrito" 
        />

        {cart.length > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="text-xl font-bold">
              Total: {formatCurrency(calculateTotal())}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button 
          label="Completar Venta" 
          variant="primary" 
          onClick={handleCompleteSale} 
          disabled={submitting || cart.length === 0}
        />
      </div>
    </div>
  );
};

export default NewSale;