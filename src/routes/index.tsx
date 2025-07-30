import {useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {useAuthStore} from '@/lib/auth/auth.store';
import {RoleBasedRoute} from '@/components/composed/role-based-route';

// Import lazy-loaded components
import {
    LazyCategories,
    LazyDashboard,
    LazyGstSettings,
    LazyMenu,
    LazyOrders,
    LazyOrderTrackingSettings,
    LazyPayments,
    LazyPrinterSettings,
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

export default function AppRoutes() {
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
                    <RoleBasedRoute requiredPermission="dashboard">
                        <LazyDashboard/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/takeaway"
                element={
                    <RoleBasedRoute requiredPermission="view-takeaway">
                        <LazyTakeaway/>
                    </RoleBasedRoute>
                }
            />
            <Route
                path="/quick-bill"
                element={
                    <RoleBasedRoute requiredPermission="create-quick-bill">
                        <LazyQuickBill/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/tables"
                element={
                    <RoleBasedRoute requiredPermission="view-tables">
                        <LazyTables/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/orders"
                element={
                    <RoleBasedRoute requiredPermission="view-orders">
                        <LazyOrders/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/menu"
                element={
                    <RoleBasedRoute requiredPermission="manage-menu">
                        <LazyMenu/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/categories"
                element={
                    <RoleBasedRoute requiredPermission="manage-categories">
                        <LazyCategories/>
                    </RoleBasedRoute>
                }
            />


            <Route
                path="/staff"
                element={
                    <RoleBasedRoute requiredPermission="manage-staff">
                        <LazyStaff/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/payments"
                element={
                    <RoleBasedRoute requiredPermission="view-payments">
                        <LazyPayments/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/user-management"
                element={
                    <RoleBasedRoute requiredPermission="manage-users">
                        <LazyUserManagement/>
                    </RoleBasedRoute>
                }/>

            <Route
                path="/profile"
                element={
                    <RoleBasedRoute requiredPermission="view-profile">
                        <LazyProfile/>
                    </RoleBasedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <RoleBasedRoute requiredPermission="view-settings">
                        <LazySettings/>
                    </RoleBasedRoute>
                }
            >
                <Route path="profile" element={<LazyProfileSettings/>}/>
                <Route path="gst" element={
                    <RoleBasedRoute requiredPermission="manage-gst-settings">
                        <LazyGstSettings/>
                    </RoleBasedRoute>
                }/>
                <Route path="order-tracking" element={
                    <RoleBasedRoute requiredPermission="manage-order-tracking-settings">
                        <LazyOrderTrackingSettings/>
                    </RoleBasedRoute>
                }/>
                <Route path="printer" element={
                    <RoleBasedRoute requiredPermission="manage-printer-settings">
                        <LazyPrinterSettings/>
                    </RoleBasedRoute>
                }/>
            </Route>

            <Route
                path="/gst-settings"
                element={
                    <Navigate to="/settings/gst" replace/>
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
