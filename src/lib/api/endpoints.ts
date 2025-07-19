export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/login',
        SIGNUP: '/first-admin',
        LOGOUT: '/auth/logout',
        REFRESH: '/refresh-token',
        PROFILE: '/auth/profile',
        CHANGE_PASSWORD: '/change-password',
    },
    ANALYTICS: {
        MENU_ITEMS: '/api/v1/analytics/menu-items',
    },
    RESTAURANT: {
        GET: '/restaurants',
        UPDATE: (id: number) => `/admin/restaurants/${id}`,
    },
    MENU: {
        ITEMS: '/api/v1/menu-items',
        CREATE: '/api/v1/menu-items',
        ITEM_UPDATE: (id: number) => `/api/v1/menu-items/${id}`,
        CATEGORY_UPDATE: (id: number) => `/api/v1/menu-categories/${id}`,
        CATEGORIES: '/api/v1/menu-categories',
    },
    ORDERS: {
        LIST: '/api/v1/orders',
        CREATE: '/api/v1/orders',
        UPDATE: (id: number) => `/api/v1/orders/${id}`,
        DELETE: (id: number) => `/api/v1/orders/${id}`,
        // New endpoints for order status management
        UPDATE_STATUS: (id: number) => `/api/v1/orders/${id}/status`,
        STATUS_HISTORY: (id: number) => `/api/v1/orders/${id}/status/history`,
        CANCEL: (id: number) => `/api/v1/orders/${id}/cancel`,
        CANCELLATIONS: (id: number) => `/api/v1/orders/${id}/cancellations`,
    },
    ORDER_ITEMS: {
        GET: (id: number) => `/api/v1/order-items/${id}`,
        CREATE: '/api/v1/order-items',
        UPDATE: (id: number) => `/api/v1/order-items/${id}`,
        DELETE: (id: number) => `/api/v1/order-items/${id}`,
        // New endpoints for order item status management
        UPDATE_STATUS: (id: number) => `/api/v1/order-items/${id}/status`,
        STATUS_HISTORY: (id: number) => `/api/v1/order-items/${id}/status/history`,
        CANCEL: (orderId: number, itemId: number) => `/api/v1/orders/${orderId}/items/${itemId}/cancel`,
        CANCELLATIONS: (id: number) => `/api/v1/order-items/${id}/cancellations`,
    },
    TABLES: {
        LIST: '/api/v1/tables',
        CREATE: '/api/v1/tables',
        UPDATE: (id: number) => `/api/v1/tables/${id}`,
        DELETE: (id: number) => `/api/v1/tables/${id}`,
    },
    STAFF: {
        LIST: '/api/v1/staff',
        CREATE: '/api/v1/staff',
        UPDATE: (id: number) => `/api/v1/staff/${id}`,
        DELETE: (id: number) => `/api/v1/staff/${id}`,
        GET_BY_ID: (id: number) => `/api/v1/staff/${id}`,
    },
    PAYMENTS: {
        LIST: '/payments',
        CREATE: '/payments',
        UPDATE: (id: number) => `/payments/${id}`,
    },
    USER_ACCOUNTS: {
        LIST: '/api/v1/users',
        CREATE: '/api/v1/users',
        UPDATE: (id: number) => `/api/v1/users/${id}`,
        DELETE: (id: number) => `/api/v1/users/${id}`,
        GET_BY_ID: (id: number) => `/api/v1/users/${id}`,
    },
    CUSTOMERS: {
        LIST: '/customers',
        CREATE: '/customers',
        UPDATE: (id: number) => `/customers/${id}`,
        DELETE: (id: number) => `/customers/${id}`,
        GET_BY_ID: (id: number) => `/customers/${id}`,
    }
};
