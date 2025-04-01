import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import MainLayout from '../../frontend/src/layout/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import InventoryList from './pages/inventory/InventoryList';
import RecipeList from './pages/recipes/RecipeList';
import ProductionList from './pages/production/ProductionList';
import SalesList from './pages/sales/SalesList';
import ReportsOverview from './pages/reports/ReportsOverview';
import NotFound from './components/common/NotFound';
import './App.css';

// Componente protegido que verifica la autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Componente que implementa las rutas
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* La ruta de registro es accesible para usuarios no autenticados */}
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <MainLayout>
              <InventoryList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RecipeList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/production"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductionList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SalesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReportsOverview />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
