export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/first-admin',
    LOGOUT: '/auth/logout',
    REFRESH: '/refresh-token',
    PROFILE: '/auth/profile',
    PASSWORD: '/auth/password',
  },
  ANALYTICS: {
    SALES: '/api/v1/analytics/sales',
    MENU_ITEMS: '/api/v1/analytics/menu-items',
    STAFF: '/api/v1/analytics/staff',
    TABLES: '/api/v1/analytics/tables',
    PAYMENT_METHODS: '/api/v1/analytics/payment-methods',
    HOURLY_SALES: '/api/v1/analytics/hourly-sales',
    CUSTOMERS: '/api/v1/analytics/customers',
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
  },
  ORDER_ITEMS: {
    GET: (id: number) => `/api/v1/order-items/${id}`,
    CREATE: '/api/v1/order-items',
    UPDATE: (id: number) => `/api/v1/order-items/${id}`,
    DELETE: (id: number) => `/api/v1/order-items/${id}`,
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
