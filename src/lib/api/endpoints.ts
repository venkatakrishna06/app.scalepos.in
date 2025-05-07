export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/first-admin',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    PASSWORD: '/auth/password',
  },
  MENU: {
    ITEMS: '/menu-items',
    CATEGORIES: '/menu-categories',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    UPDATE: (id: number) => `/orders/${id}`,
    DELETE: (id: number) => `/orders/${id}`,
  },
  TABLES: {
    LIST: '/restaurant-tables',
    CREATE: '/restaurant-tables',
    UPDATE: (id: number) => `/restaurant-tables/${id}`,
    DELETE: (id: number) => `/restaurant-tables/${id}`,
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
