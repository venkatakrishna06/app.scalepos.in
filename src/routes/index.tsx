import { Routes, Route, Navigate } from 'react-router-dom';
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

export default function AppRoutes({ orderType }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tables" replace />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/dashboard" element={<Dashboard orderType={orderType} />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/reservations" element={<Reservations />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}