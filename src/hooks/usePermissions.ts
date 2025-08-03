// src/hooks/usePermissions.ts

import { useAuthStore } from '@/lib/auth/auth.store';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/auth/roles';

export const usePermissions = () => {
    const { user } = useAuthStore();
    
    const hasPermission = (permission: string) => {
        if (!user) {
            return false;
        }
        if (user.role === "admin") {
            return true;
        }

        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
    };

    // Helper functions for common permission checks
    const canCreateOrders = () => hasPermission(PERMISSIONS.CREATE_ORDER);
    const canViewOrders = () => hasPermission(PERMISSIONS.READ_ORDER);
    const canUpdateOrders = () => hasPermission(PERMISSIONS.UPDATE_ORDER);
    const canDeleteOrders = () => hasPermission(PERMISSIONS.DELETE_ORDER);
    const canServeOrders = () => hasPermission(PERMISSIONS.SERVE_ORDER);
    const canPrepareOrders = () => hasPermission(PERMISSIONS.PREPARE_ORDER);
    
    const canManageMenu = () => hasPermission(PERMISSIONS.MANAGE_MENU) || 
        (hasPermission(PERMISSIONS.CREATE_MENU) && hasPermission(PERMISSIONS.UPDATE_MENU));
    
    const canManageUsers = () => hasPermission(PERMISSIONS.MANAGE_USERS) || 
        (hasPermission(PERMISSIONS.READ_USER) && hasPermission(PERMISSIONS.UPDATE_USER));
    
    const canCancelOrders = () => hasPermission(PERMISSIONS.DELETE_ORDER);
    
    const isAdmin = () => user?.role === "admin";
    const isManager = () => user?.role === "manager";
    const isServer = () => user?.role === "server";
    const isKitchen = () => user?.role === "kitchen";

    return { 
        hasPermission,
        canCreateOrders,
        canViewOrders,
        canUpdateOrders,
        canDeleteOrders,
        canServeOrders,
        canPrepareOrders,
        canManageMenu,
        canManageUsers,
        canCancelOrders,
        isAdmin,
        isManager,
        isServer,
        isKitchen
    };
};
