// src/lib/auth/roles.ts

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
};

export const PERMISSIONS = {
    // User Management
    CREATE_USER: 'create_user',
    READ_USER: 'read_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',

    // Order Management
    CREATE_ORDER: 'create_order',
    READ_ORDER: 'read_order',
    UPDATE_ORDER: 'update_order',
    DELETE_ORDER: 'delete_order',

    // Menu Management
    CREATE_MENU: 'create_menu',
    READ_MENU: 'read_menu',
    UPDATE_MENU: 'update_menu',
    DELETE_MENU: 'delete_menu',

    // Table Management
    CREATE_TABLE: 'create_table',
    READ_TABLE: 'read_table',
    UPDATE_TABLE: 'update_table',
    DELETE_TABLE: 'delete_table',

    // Payment Management
    CREATE_PAYMENT: 'create_payment',
    READ_PAYMENT: 'read_payment',

    // Settings
    UPDATE_SETTINGS: 'update_settings',
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.READ_USER,
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.READ_ORDER,
        PERMISSIONS.UPDATE_ORDER,
        PERMISSIONS.READ_MENU,
        PERMISSIONS.READ_TABLE,
        PERMISSIONS.CREATE_PAYMENT,
        PERMISSIONS.READ_PAYMENT,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.READ_ORDER,
        PERMISSIONS.READ_MENU,
        PERMISSIONS.READ_TABLE,
        PERMISSIONS.CREATE_PAYMENT,
        PERMISSIONS.READ_PAYMENT,
    ],
};
