import React from 'react';
import {SuspenseWrapper} from '@/components/suspense/SuspenseWrapper';
import {ErrorCategory, errorService} from '@/lib/services/error.service';
import {TablesSkeleton} from "@/components/composed/tables-skeleton.tsx";
import {OrdersSkeleton} from "@/components/composed/orders-skeleton.tsx";
import {MenuSkeleton} from "@/components/composed/menu-skeleton.tsx";
import {CategoriesSkeleton} from "@/components/composed/categories-skeleton.tsx";
import {StaffSkeleton} from "@/components/composed/staff-skeleton.tsx";
import {PaymentsSkeleton} from "@/components/composed/payments-skeleton.tsx";
import {UserManagementSkeleton} from "@/components/composed/user-management-skeleton.tsx";


// Lazy load pages to reduce initial bundle size
const Dashboard = React.lazy(() => import('@/pages/dashboard'));
const Tables = React.lazy(() => import('@/features/Table/routes/Tables'));
const Orders = React.lazy(() => import('@/features/Order/routes/Orders'));
const Takeaway = React.lazy(() => import('@/pages/takeaway'));
const Menu = React.lazy(() => import('@/features/Menu/routes/Menu'));
const Categories = React.lazy(() => import('@/features/Category/routes/Categories'));
const Staff = React.lazy(() => import('@/features/Staff/routes/Staff'));
const Payments = React.lazy(() => import('@/features/Payment/routes/Payments'));
const Profile = React.lazy(() => import('@/features/Profile/routes/Profile'));
const UserManagement = React.lazy(() => import('@/pages/UserManagement'));
const Settings = React.lazy(() => import('@/pages/settings'));
const ProfileSettings = React.lazy(() => import('@/pages/settings/profile-settings'));
const GstSettings = React.lazy(() => import('@/pages/settings/gst-settings'));
const OrderTrackingSettings = React.lazy(() => import('@/pages/settings/order-tracking-settings'));
const PrinterSettings = React.lazy(() => import('@/pages/settings/printer-settings'));
const QuickBill = React.lazy(() => import('@/pages/quick-bill'));

// Error handler for lazy-loaded components
const handleLazyLoadError = (error: Error, info: React.ErrorInfo) => {
    errorService.logError(
        error,
        ErrorCategory.UNEXPECTED,
        {componentStack: info.componentStack}
    );
};

// Wrap lazy-loaded components with SuspenseWrapper
export const LazyDashboard = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <Dashboard/>
    </SuspenseWrapper>
);

export const LazyTables = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<TablesSkeleton/>}
    >
        <Tables/>
    </SuspenseWrapper>
);

export const LazyOrders = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<OrdersSkeleton/>}
    >
        <Orders/>
    </SuspenseWrapper>
);

export const LazyTakeaway = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <Takeaway/>
    </SuspenseWrapper>
);

export const LazyMenu = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<MenuSkeleton/>}
    >
        <Menu/>
    </SuspenseWrapper>
);

export const LazyCategories = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<CategoriesSkeleton/>}
    >
        <Categories/>
    </SuspenseWrapper>
);

export const LazyStaff = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<StaffSkeleton/>}
    >
        <Staff/>
    </SuspenseWrapper>
);

export const LazyPayments = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<PaymentsSkeleton/>}
    >
        <Payments/>
    </SuspenseWrapper>
);

export const LazyProfile = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <Profile/>
    </SuspenseWrapper>
);

export const LazyUserManagement = () => (
    <SuspenseWrapper
        onError={handleLazyLoadError}
        fallback={<UserManagementSkeleton/>}
    >
        <UserManagement/>
    </SuspenseWrapper>
);

export const LazySettings = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <Settings/>
    </SuspenseWrapper>
);

export const LazyProfileSettings = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <ProfileSettings/>
    </SuspenseWrapper>
);

export const LazyGstSettings = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <GstSettings/>
    </SuspenseWrapper>
);

export const LazyOrderTrackingSettings = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <OrderTrackingSettings/>
    </SuspenseWrapper>
);

export const LazyPrinterSettings = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <PrinterSettings/>
    </SuspenseWrapper>
);

export const LazyQuickBill = () => (
    <SuspenseWrapper onError={handleLazyLoadError}>
        <QuickBill/>
    </SuspenseWrapper>
);
