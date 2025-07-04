import React from 'react';
import { SuspenseWrapper } from '@/components/suspense/SuspenseWrapper';
import { errorService, ErrorCategory } from '@/lib/services/error.service';

// Lazy load pages to reduce initial bundle size
const Dashboard = React.lazy(() => import('@/pages/dashboard'));
const Tables = React.lazy(() => import('@/pages/tables'));
const Orders = React.lazy(() => import('@/pages/orders'));
const Takeaway = React.lazy(() => import('@/pages/takeaway'));
const Menu = React.lazy(() => import('@/pages/menu'));
const Categories = React.lazy(() => import('@/pages/categories'));
const Staff = React.lazy(() => import('@/pages/staff'));
const Payments = React.lazy(() => import('@/pages/payments'));
const Profile = React.lazy(() => import('@/pages/profile'));
const UserManagement = React.lazy(() => import('@/pages/UserManagement'));
const Settings = React.lazy(() => import('@/pages/settings'));
const ProfileSettings = React.lazy(() => import('@/pages/settings/profile-settings'));
const GstSettings = React.lazy(() => import('@/pages/settings/gst-settings'));
const OrderTrackingSettings = React.lazy(() => import('@/pages/settings/order-tracking-settings'));
const QuickBill = React.lazy(() => import('@/pages/quick-bill'));

// Error handler for lazy-loaded components
const handleLazyLoadError = (error: Error, info: React.ErrorInfo) => {
  errorService.logError(
    error, 
    ErrorCategory.UNEXPECTED, 
    { componentStack: info.componentStack }
  );
};

// Wrap lazy-loaded components with SuspenseWrapper
export const LazyDashboard = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Dashboard />
  </SuspenseWrapper>
);

export const LazyTables = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Tables />
  </SuspenseWrapper>
);

export const LazyOrders = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Orders />
  </SuspenseWrapper>
);

export const LazyTakeaway = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Takeaway />
  </SuspenseWrapper>
);

export const LazyMenu = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Menu />
  </SuspenseWrapper>
);

export const LazyCategories = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Categories />
  </SuspenseWrapper>
);

export const LazyStaff = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Staff />
  </SuspenseWrapper>
);

export const LazyPayments = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Payments />
  </SuspenseWrapper>
);

export const LazyProfile = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Profile />
  </SuspenseWrapper>
);

export const LazyUserManagement = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <UserManagement />
  </SuspenseWrapper>
);

export const LazySettings = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <Settings />
  </SuspenseWrapper>
);

export const LazyProfileSettings = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <ProfileSettings />
  </SuspenseWrapper>
);

export const LazyGstSettings = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <GstSettings />
  </SuspenseWrapper>
);

export const LazyOrderTrackingSettings = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <OrderTrackingSettings />
  </SuspenseWrapper>
);

export const LazyQuickBill = () => (
  <SuspenseWrapper onError={handleLazyLoadError}>
    <QuickBill />
  </SuspenseWrapper>
);
