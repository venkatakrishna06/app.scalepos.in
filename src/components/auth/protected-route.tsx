import {ReactNode, useEffect, useState} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {tokenService} from '@/lib/services/token.service';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // Optional single role-based access control
  requiredRoles?: string[]; // Optional multiple roles-based access control
}

export const ProtectedRoute = ({ children, requiredRole, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, initAuth, loading } = useAuthStore();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if token is valid but user data is not loaded yet
      if (tokenService.isTokenValid() && !user) {
        await initAuth();
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [initAuth, user]);

  // Show loading state while checking authentication or initializing
  if (loading || !isInitialized) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensure user data is loaded before checking roles
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading user data...</div>;
  }

  // If single role is required, check if user has the required role
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If multiple roles are required, check if user has one of the required roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If authenticated and has required role(s) (if any), render the children
  return <>{children}</>;
};
