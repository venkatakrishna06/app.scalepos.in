// src/hooks/usePermissions.ts

import { useAuthStore } from '@/lib/auth/auth.store';
import { ROLE_PERMISSIONS } from '@/lib/auth/roles';

export const usePermissions = () => {
    const { user } = useAuthStore();

    const hasPermission = (permission: string) => {
        if (!user) {
            return false;
        }

        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
    };

    return { hasPermission };
};
