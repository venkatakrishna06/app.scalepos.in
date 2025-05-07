import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { tokenService } from '@/lib/services/token.service';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // Optional role-based access control
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, initAuth, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Check if token is valid but user data is not loaded yet
    if (tokenService.isTokenValid() && !user) {
      initAuth();
    }
  }, [initAuth, user]);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required, check if user has the required role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role (if any), render the children
  return <>{children}</>;
};