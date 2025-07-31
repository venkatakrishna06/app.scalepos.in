import {ReactNode} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAuthStore} from '@/lib/auth/auth.store';
import {usePermissions} from '@/hooks/usePermissions';

interface RoleBasedRouteProps {
    children: ReactNode;
    requiredPermission: string;
}

export const RoleBasedRoute = ({children, requiredPermission}: RoleBasedRouteProps) => {
    // Use isInitializing instead of loading for the initial check
    const {isAuthenticated, isInitializing} = useAuthStore();
    const {hasPermission} = usePermissions();
    const location = useLocation();

    // Show a loading screen only during the initial authentication process
    if (isInitializing) {
        return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{from: location}} replace/>;
    }

    if (!hasPermission(requiredPermission)) {
        return <Navigate to="/unauthorized" replace/>;
    }

    return <>{children}</>;
};
