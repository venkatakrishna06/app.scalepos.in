import {useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {ProtectedRoute} from '@/components/auth/protected-route';

// Import lazy-loaded components
import {
    LazyCategories,
    LazyDashboard,
    LazyGstSettings,
    LazyMenu,
    LazyOrders,
    LazyOrderTrackingSettings,
    LazyPayments,
    LazyProfile,
    LazyProfileSettings,
    LazyQuickBill,
    LazySettings,
    LazyStaff,
    LazyTables,
    LazyTakeaway,
    LazyUserManagement
} from '@/routes/lazyRoutes';

// Import non-lazy-loaded pages (login and error pages should load quickly)
import Login from '@/pages/auth/login';
import Unauthorized from '@/pages/unauthorized';

// Component to handle role-based redirection
const RoleBasedRedirect = () => {
    const {user, isAuthenticated} = useAuthStore();

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    // Redirect based on user role
    if (user) {
        if (user.role === 'admin') {
            return <Navigate to="/dashboard" replace/>;
        } else if (user.role === 'kitchen') {
            return <Navigate to="/orders" replace/>;
        } else if (user.role === 'manager' || user.role === 'server') {
            return <Navigate to="/tables" replace/>;
        }
    }

    // Default fallback
    return <Navigate to="/tables" replace/>;
};

const AppRoutes = () => {
    const {initAuth} = useAuthStore();

    // Initialize authentication on app startup
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login/>}/>
            <Route path="/unauthorized" element={<Unauthorized/>}/>

            {/* Protected routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <LazyDashboard/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/takeaway"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'server']}>
                        <LazyTakeaway/>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/quick-bill"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'server']}>
                        <LazyQuickBill/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/tables"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'server']}>
                        <LazyTables/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/orders"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen', 'server']}>
                        <LazyOrders/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/menu"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen']}>
                        <LazyMenu/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/categories"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                        <LazyCategories/>
                    </ProtectedRoute>
                }
            />


            <Route
                path="/staff"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <LazyStaff/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/payments"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                        <LazyPayments/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/user-management"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <LazyUserManagement/>
                    </ProtectedRoute>
                }/>

            <Route
                path="/profile"
                element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen', 'server']}>
                        <LazyProfile/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <LazySettings/>
                    </ProtectedRoute>
                }
            >
                <Route path="profile" element={<LazyProfileSettings/>}/>
                <Route path="gst" element={
                    <ProtectedRoute requiredRole="admin">
                        <LazyGstSettings/>
                    </ProtectedRoute>
                }/>
                <Route path="order-tracking" element={
                    <ProtectedRoute requiredRole="admin">
                        <LazyOrderTrackingSettings/>
                    </ProtectedRoute>
                }/>
            </Route>

            <Route
                path="/gst-settings"
                element={
                    <Navigate to="/settings/gst" replace/>
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

            {/* Redirect based on user role if authenticated, otherwise to login */}
            <Route
                path="/"
                element={
                    <RoleBasedRedirect/>
                }
            />

            {/* Catch all route - 404 */}
            <Route path="*" element={<div>Page Not Found</div>}/>
        </Routes>
    );
};

export default AppRoutes;
