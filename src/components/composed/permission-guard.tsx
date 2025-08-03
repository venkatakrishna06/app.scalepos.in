import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions.
 * 
 * @param permission - A single permission string or array of permission strings required to render the children
 * @param children - The content to render if the user has the required permission(s)
 * @param fallback - Optional content to render if the user doesn't have the required permission(s)
 * 
 * @example
 * // Render a button only if user has 'create:order' permission
 * <PermissionGuard permission="create:order">
 *   <Button>Create Order</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Render a button only if user has both 'update:menu' and 'create:menu' permissions
 * <PermissionGuard permission={["update:menu", "create:menu"]}>
 *   <Button>Manage Menu</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Render a fallback if user doesn't have the required permission
 * <PermissionGuard 
 *   permission="delete:order" 
 *   fallback={<div>You don't have permission to delete orders</div>}
 * >
 *   <Button>Delete Order</Button>
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = usePermissions();
  
  // Check if user has all required permissions
  const hasRequiredPermission = Array.isArray(permission)
    ? permission.every(p => hasPermission(p))
    : hasPermission(permission);

  // Render children if user has permission, otherwise render fallback
  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
};