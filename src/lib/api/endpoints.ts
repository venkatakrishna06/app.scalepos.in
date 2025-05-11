export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/first-admin',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    PASSWORD: '/auth/password',
  },
  RESTAURANT: {
    GET: '/restaurants',
    UPDATE: (id: number) => `/admin/restaurants/${id}`,
  },
  MENU: {
    ITEMS: '/all-roles/menu-items',
    CREATE: '/admin-kitchen-manager/menu-items',
    ITEM_UPDATE : (id: number) => `/admin-kitchen-manager/menu-items/${id}`,
    CATEGORY_UPDATE : (id: number) => `/admin-kitchen-manager/menu-categories/${id}`,


    CATEGORIES: 'all-roles/menu-categories',
  },
  ORDERS: {
    LIST: '/all-roles/orders',
    CREATE: '/admin-manager-server/orders',
    UPDATE: (id: number) => `/admin-manager-server/orders/${id}`,
    DELETE: (id: number) => `/admin/orders/${id}`,
    // // All roles endpoints
    // ALL_LIST: '/all-roles/orders',
    // ALL_BY_ID: (id: number) => `/all-roles/orders/${id}`,
  },
  ORDER_ITEMS: {
    GET: (id: number) => `/order-items/${id}`,
    CREATE: '/admin-manager-server/order-items',
    UPDATE: (id: number) => `/admin-manager-server/order-items/${id}`,
    DELETE: (id: number) => `/admin/order-items/${id}`,
  },
  TABLES: {
    LIST: '/admin-manager-server/restaurant-tables',
    CREATE: '/admin-manager-server/restaurant-tables',
    UPDATE: (id: number) => `/admin-manager-server/restaurant-tables/${id}`,
    DELETE: (id: number) => `/admin-manager-server/restaurant-tables/${id}`,
  },
  STAFF: {
    LIST: '/admin-manager/staff',
    CREATE: '/admin/staff',
    UPDATE: (id: number) => `/admin-manager/staff/${id}`,
    DELETE: (id: number) => `/admin/staff/${id}`,
    GET_BY_ID: (id: number) => `/admin-manager/staff/${id}`,
  },
  PAYMENTS: {
    LIST: '/payments',
    CREATE: '/payments',
    UPDATE: (id: number) => `/payments/${id}`,
  },
  USER_ACCOUNTS:{
    LIST: '/admin/user-accounts',
    CREATE: '/admin/user-accounts',
    UPDATE: (id: number) => `/admin/user-accounts/${id}`,
    DELETE: (id: number) => `/admin/user-accounts/${id}`,
    GET_BY_ID: (id: number) => `/admin/user-accounts/${id}`,
  }
};
