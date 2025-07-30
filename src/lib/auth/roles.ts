// src/lib/auth/roles.ts

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
};

export const PERMISSIONS = {
    // User Management
    MANAGE_USERS: 'manage-users',
    // Order Management
    VIEW_ORDERS: 'view-orders',
    // Menu Management
    MANAGE_MENU: 'manage-menu',
    // Table Management
    VIEW_TABLES: 'view-tables',
    // Payment Management
    VIEW_PAYMENTS: 'view-payments',
    // Settings
    VIEW_SETTINGS: 'view-settings',
    MANAGE_CATEGORIES: 'manage-categories',
    MANAGE_STAFF: 'manage-staff',
    VIEW_PROFILE: 'view-profile',
    MANAGE_GST_SETTINGS: 'manage-gst-settings',
    MANAGE_ORDER_TRACKING_SETTINGS: 'manage-order-tracking-settings',
    MANAGE_PRINTER_SETTINGS: 'manage-printer-settings',
    CREATE_QUICK_BILL: 'create-quick-bill',
    VIEW_TAKEAWAY: 'view-takeaway',
    DASHBOARD: 'dashboard',

};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        ...Object.values(PERMISSIONS),
        'admin',
        'dashboard'
    ],
    [ROLES.MANAGER]: [
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.MANAGE_MENU,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.VIEW_PAYMENTS,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.MANAGE_CATEGORIES,
        PERMISSIONS.MANAGE_STAFF,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.CREATE_QUICK_BILL,
        PERMISSIONS.VIEW_TAKEAWAY,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.VIEW_PAYMENTS,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.CREATE_QUICK_BILL,
        PERMISSIONS.VIEW_TAKEAWAY,
    ],
};
