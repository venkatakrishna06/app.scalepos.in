import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { ProtectedRoute } from '@/components/auth/protected-route';

// Import your pages
import Login from '@/pages/auth/login';
import Dashboard from '@/pages/dashboard';
import Tables from '@/pages/tables';
import Orders from '@/pages/orders';
import Menu from '@/pages/menu';
import Categories from '@/pages/categories';
import Reservations from '@/pages/reservations';
import Customers from '@/pages/customers';
import Staff from '@/pages/staff';
import Payments from '@/pages/payments';
import Profile from '@/pages/profile';

interface AppRoutesProps {
  orderType: 'dine-in' | 'takeaway' | 'orders';
}

const AppRoutes = ({ orderType }: AppRoutesProps) => {
  // This will be used in the future when implementing order-specific routes
  console.log('Current order type:', orderType);
  const { initAuth } = useAuthStore();

  // Initialize authentication on app startup
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard orderType={orderType} />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/tables" 
        element={
          <ProtectedRoute>
            <Tables />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/menu" 
        element={
          <ProtectedRoute>
            <Menu />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/categories" 
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/reservations" 
        element={
          <ProtectedRoute>
            <Reservations />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/staff" 
        element={
          <ProtectedRoute>
            <Staff />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Role-based protected route example */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <div>Admin Page (Protected, Admin Only)</div>
          </ProtectedRoute>
        } 
      />

      {/* Redirect to dashboard if authenticated, otherwise to login */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />

      {/* Catch all route - 404 */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
