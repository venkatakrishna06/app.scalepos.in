import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/axios';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // useEffect(() => {
  //   // Verify token on mount and setup interval
  //   const verifyToken = async () => {
  //     if (!token) return;
  //
  //     try {
  //       await api.get('/auth/verify');
  //     } catch (error) {
  //       await logout();
  //       navigate('/login', { state: { from: location }, replace: true });
  //     }
  //   };
  //
  //   verifyToken();
  //   const interval = setInterval(verifyToken, 5 * 60 * 1000); // Check every 5 minutes
  //
  //   return () => clearInterval(interval);
  // }, [token, logout, navigate, location]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}