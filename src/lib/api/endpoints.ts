export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  MENU: {
    ITEMS: '/menu/items',
    CATEGORIES: '/menu/categories',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    UPDATE: (id: number) => `/orders/${id}`,
    DELETE: (id: number) => `/orders/${id}`,
  },
  TABLES: {
    LIST: '/tables',
    CREATE: '/tables',
    UPDATE: (id: number) => `/tables/${id}`,
    DELETE: (id: number) => `/tables/${id}`,
  },
  STAFF: {
    LIST: '/staff',
    CREATE: '/staff',
    UPDATE: (id: number) => `/staff/${id}`,
    DELETE: (id: number) => `/staff/${id}`,
  },
  PAYMENTS: {
    LIST: '/payments',
    CREATE: '/payments',
    UPDATE: (id: number) => `/payments/${id}`,
  },
};