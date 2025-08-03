// src/lib/auth/roles.ts

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SERVER: 'server',
    KITCHEN: 'kitchen',
};

export type Permission = string;

export const PERMISSIONS = {
    // User Management
    CREATE_USER: 'create:user',
    READ_USER: 'read:user',
    UPDATE_USER: 'update:user',
    DELETE_USER: 'delete:user',
    
    // Menu Management
    CREATE_MENU: 'create:menu',
    READ_MENU: 'read:menu',
    UPDATE_MENU: 'update:menu',
    DELETE_MENU: 'delete:menu',
    
    // Order Management
    CREATE_ORDER: 'create:order',
    READ_ORDER: 'read:order',
    UPDATE_ORDER: 'update:order',
    DELETE_ORDER: 'delete:order',
    SERVE_ORDER: 'serve:order',
    PREPARE_ORDER: 'prepare:order',
    
    // Table Management
    CREATE_TABLE: 'create:table',
    READ_TABLE: 'read:table',
    UPDATE_TABLE: 'update:table',
    DELETE_TABLE: 'delete:table',
    ASSIGN_TABLE: 'assign:table',
    
    // Payment Management
    CREATE_PAYMENT: 'create:payment',
    READ_PAYMENT: 'read:payment',
    UPDATE_PAYMENT: 'update:payment',
    DELETE_PAYMENT: 'delete:payment',
    
    // Staff Management
    CREATE_STAFF: 'create:staff',
    READ_STAFF: 'read:staff',
    UPDATE_STAFF: 'update:staff',
    DELETE_STAFF: 'delete:staff',
    
    // Legacy permissions (keeping for backward compatibility)
    MANAGE_USERS: 'manage-users',
    VIEW_ORDERS: 'view-orders',
    MANAGE_MENU: 'manage-menu',
    VIEW_TABLES: 'view-tables',
    VIEW_PAYMENTS: 'view-payments',
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
        // Admin has all permissions
        PERMISSIONS.CREATE_USER, PERMISSIONS.READ_USER, PERMISSIONS.UPDATE_USER, PERMISSIONS.DELETE_USER,
        PERMISSIONS.CREATE_MENU, PERMISSIONS.READ_MENU, PERMISSIONS.UPDATE_MENU, PERMISSIONS.DELETE_MENU,
        PERMISSIONS.CREATE_ORDER, PERMISSIONS.READ_ORDER, PERMISSIONS.UPDATE_ORDER, PERMISSIONS.DELETE_ORDER, PERMISSIONS.SERVE_ORDER, PERMISSIONS.PREPARE_ORDER,
        PERMISSIONS.CREATE_TABLE, PERMISSIONS.READ_TABLE, PERMISSIONS.UPDATE_TABLE, PERMISSIONS.DELETE_TABLE, PERMISSIONS.ASSIGN_TABLE,
        PERMISSIONS.CREATE_PAYMENT, PERMISSIONS.READ_PAYMENT, PERMISSIONS.UPDATE_PAYMENT, PERMISSIONS.DELETE_PAYMENT,
        PERMISSIONS.CREATE_STAFF, PERMISSIONS.READ_STAFF, PERMISSIONS.UPDATE_STAFF, PERMISSIONS.DELETE_STAFF,
        
        // Legacy permissions
        ...Object.values(PERMISSIONS),
        'admin',
        'dashboard'
    ],
    [ROLES.MANAGER]: [
        // Manager has most permissions except deleting critical data
        PERMISSIONS.READ_USER, PERMISSIONS.UPDATE_USER,
        PERMISSIONS.CREATE_MENU, PERMISSIONS.READ_MENU, PERMISSIONS.UPDATE_MENU,
        PERMISSIONS.CREATE_ORDER, PERMISSIONS.READ_ORDER, PERMISSIONS.UPDATE_ORDER, PERMISSIONS.SERVE_ORDER,
        PERMISSIONS.CREATE_TABLE, PERMISSIONS.READ_TABLE, PERMISSIONS.UPDATE_TABLE, PERMISSIONS.ASSIGN_TABLE,
        PERMISSIONS.CREATE_PAYMENT, PERMISSIONS.READ_PAYMENT, PERMISSIONS.UPDATE_PAYMENT,
        PERMISSIONS.READ_STAFF, PERMISSIONS.UPDATE_STAFF,
        
        // Legacy permissions
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
    [ROLES.SERVER]: [
        // Server has customer-facing permissions
        PERMISSIONS.READ_MENU,
        PERMISSIONS.CREATE_ORDER, PERMISSIONS.READ_ORDER, PERMISSIONS.UPDATE_ORDER, PERMISSIONS.SERVE_ORDER,
        PERMISSIONS.READ_TABLE, PERMISSIONS.ASSIGN_TABLE, PERMISSIONS.UPDATE_TABLE,
        PERMISSIONS.CREATE_PAYMENT, PERMISSIONS.READ_PAYMENT, PERMISSIONS.UPDATE_PAYMENT,
        
        // Legacy permissions
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.VIEW_PAYMENTS,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.CREATE_QUICK_BILL,
        PERMISSIONS.VIEW_TAKEAWAY,
    ],
    [ROLES.KITCHEN]: [
        // Kitchen has food preparation permissions
        PERMISSIONS.CREATE_MENU, PERMISSIONS.READ_MENU, PERMISSIONS.UPDATE_MENU,
        PERMISSIONS.READ_ORDER, PERMISSIONS.UPDATE_ORDER, PERMISSIONS.PREPARE_ORDER,
        
        // Legacy permissions
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.MANAGE_MENU,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.VIEW_PROFILE,
    ],
};
