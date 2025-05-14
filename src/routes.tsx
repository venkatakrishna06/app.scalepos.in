import {useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {ProtectedRoute} from '@/components/auth/protected-route';

// Import your pages
import Login from '@/pages/auth/login';
import Dashboard from '@/pages/dashboard';
import Tables from '@/pages/tables';
import Orders from '@/pages/orders';
import Takeaway from '@/pages/takeaway';
import Menu from '@/pages/menu';
import Categories from '@/pages/categories';
import Reservations from '@/pages/reservations';
import Customers from '@/pages/customers';
import Staff from '@/pages/staff';
import Payments from '@/pages/payments';
import Profile from '@/pages/profile';
import UserManagement from './pages/UserManagement';
import Settings from '@/pages/settings';
import ProfileSettings from '@/pages/settings/profile-settings';
import GstSettings from '@/pages/settings/gst-settings';
import Unauthorized from '@/pages/unauthorized';
import Analytics from '@/pages/analytics';

const AppRoutes = () => {
  const { initAuth } = useAuthStore();

  // Initialize authentication on app startup
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen', 'server']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/takeaway" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'server']}>
            <Takeaway />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/tables" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'server']}>
            <Tables />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/orders" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen', 'server']}>
            <Orders />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/menu" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen']}>
            <Menu />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/categories" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Categories />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/reservations" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Reservations />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/customers" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Customers />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/staff" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Staff />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/payments" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Payments />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Analytics />
          </ProtectedRoute>
        } 
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute requiredRole="admin">
            <UserManagement />
          </ProtectedRoute>
        }/>

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen', 'server']}>
            <Profile />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      >
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="gst" element={
          <ProtectedRoute requiredRole="admin">
            <GstSettings />
          </ProtectedRoute>
        } />
      </Route>

      <Route 
        path="/gst-settings" 
        element={
          <Navigate to="/settings/gst" replace />
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
        element={<Navigate to="/tables" replace />}
      />

      {/* Catch all route - 404 */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
