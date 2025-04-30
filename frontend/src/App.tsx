import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthProvider from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import MainLayout from '../../frontend/src/layout/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import InventoryList from './pages/inventory/InventoryList';
import IncomingInventory from './pages/inventory/IncomingInventory';
import RecipeList from './pages/recipes/RecipeList';
import ProductionList from './pages/production/ProductionList';
import StartProduction from './pages/production/StartProduction';
import DailyProduction from './pages/production/DailyProduction';
import WeeklyProduction from './pages/production/WeeklyProduction';
import SalesList from './pages/sales/SalesList';
import NewSale from './pages/sales/NewSale';
import DailySales from './pages/sales/DailySales';
import WeeklySales from './pages/sales/WeeklySales';
import MonthlySales from './pages/sales/MonthlySales';
import ReportsOverview from './pages/reports/ReportsOverview';
import InventoryReport from './pages/reports/InventoryReport';
import SalesReport from './pages/reports/SalesReport';
import Equipo from './pages/Equipo';
import NotFound from './components/common/NotFound';
import EditSale from './pages/sales/EditSale';
import './App.css';

// Componente protegido que verifica la autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Componente que verifica el rol de administrador
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (user?.rol !== 'administrador') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

// Componente que implementa las rutas
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* Rutas de recuperación de contraseña */}
      <Route 
        path="/forgot-password" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPassword />}
      />
      <Route 
        path="/reset-password" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <ResetPassword />}
      />
      
      {/* Rutas protegidas básicas */}
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
        path="/inventory/incoming"
        element={
          <ProtectedRoute>
            <MainLayout>
              <IncomingInventory />
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
        path="/production/start"
        element={
          <ProtectedRoute>
            <MainLayout>
              <StartProduction />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/production/daily"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DailyProduction />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/production/weekly"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WeeklyProduction />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Rutas de Ventas */}
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
        path="/sales/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <NewSale />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/edit/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EditSale />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/daily"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DailySales />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/weekly"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WeeklySales />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/monthly"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MonthlySales />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Rutas protegidas para administradores */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <ReportsOverview />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/inventory"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <InventoryReport />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/sales"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <SalesReport />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <Equipo />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
