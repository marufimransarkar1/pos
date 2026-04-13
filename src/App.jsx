import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore.js';
import { useSettingsStore } from './store/index.js';

// Layout
import DashboardLayout from './components/layout/DashboardLayout.jsx';

// Pages
import SetupWizard from './pages/SetupWizard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import POSPage from './pages/POSPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductFormPage from './pages/ProductFormPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import BrandsPage from './pages/BrandsPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import PurchasesPage from './pages/PurchasesPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import SuppliersPage from './pages/SuppliersPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import StockPage from './pages/StockPage.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { token, user, isLoading } = useAuthStore();

  // 1. If we are still checking the session, show a loader
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // 2. If there is no token, the user isn't logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role-based access control
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore();
  const { initDarkMode, fetchSettings } = useSettingsStore();

  useEffect(() => {
    initDarkMode();
    if (isAuthenticated) {
      fetchMe();
      fetchSettings();
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm',
          duration: 3500,
          style: { borderRadius: '12px', padding: '12px 16px' },
        }}
      />
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/login" element={<LoginPage />} />
        {/* <Route
          path="/"
          element={
              <DashboardLayout />
          }
        > */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
