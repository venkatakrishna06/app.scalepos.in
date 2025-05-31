import {Navigate, Route, Routes} from 'react-router-dom';
import Dashboard from '@/pages/dashboard';
import Tables from '@/pages/tables';
import Orders from '@/pages/orders';
import Menu from '@/pages/menu';
import Categories from '@/pages/categories';
import Staff from '@/pages/staff';
import Payments from '@/pages/payments';
import Profile from '@/pages/profile';
import UserManagement from '../pages/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';

interface AppRoutesProps {
  orderType: 'dine-in' | 'takeaway' | 'orders';
}

export default function AppRoutes({ orderType }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tables" replace />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/dashboard" element={<Dashboard orderType={orderType} />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/profile" element={<Profile />} />
      <Route 
        path="/user-management" 
        element={
          <ProtectedRoute requiredRole="admin">
            <UserManagement />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
