import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the current location
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
      return <Navigate to="/unauthorized\" replace />;
    }
  }

  // If authenticated and has required role(s) (if any), render the children
  return <>{children}</>;
}