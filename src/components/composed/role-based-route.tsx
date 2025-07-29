import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth/auth.store';
import { usePermissions } from '@/hooks/usePermissions';

interface RoleBasedRouteProps {
    children: ReactNode;
    requiredPermission: string;
}

export const RoleBasedRoute = ({ children, requiredPermission }: RoleBasedRouteProps) => {
    const { isAuthenticated, loading } = useAuthStore();
    const { hasPermission } = usePermissions();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasPermission(requiredPermission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};
