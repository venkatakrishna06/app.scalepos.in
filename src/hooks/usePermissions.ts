import {useAuthStore} from '@/lib/store/auth.store';

export function usePermissions() {
    const {user} = useAuthStore();

    return {
        // Role-based permissions
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager',
        isKitchen: user?.role === 'kitchen',
        isServer: user?.role === 'server',

        // Feature-based permissions
        canManageUsers: user?.role === 'admin',
        canManageStaff: user?.role === 'admin',
        canCreateStaff: user?.role === 'admin',
        canManageMenu: ['admin', 'manager', 'kitchen'].includes(user?.role || ''),
        canCreateMenuItem: ['admin', 'manager', 'kitchen'].includes(user?.role || ''),
        canUpdateMenuItem: ['admin', 'manager', 'kitchen'].includes(user?.role || ''),
        canManageTables: ['admin', 'manager', 'server'].includes(user?.role || ''),
        canViewOrders: ['admin', 'manager', 'kitchen', 'server'].includes(user?.role || ''),
        canCreateOrders: ['admin', 'manager', 'server'].includes(user?.role || ''),
        canCancelOrders: user?.role === 'admin',
        canCancelOrderItems: ['admin', 'manager'].includes(user?.role || ''),
        canManagePayments: ['admin', 'manager'].includes(user?.role || ''),
        canManageCategories: ['admin', 'manager'].includes(user?.role || ''),
        canAccessSettings: ['admin', 'manager'].includes(user?.role || ''),
    };
}
