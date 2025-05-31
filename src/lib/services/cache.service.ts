/**
 * Cache service for storing and retrieving data from local storage with TTL
 * 
 * This service provides methods for:
 * - Storing data in local storage with a TTL
 * - Retrieving data from local storage
 * - Checking if cached data is still valid
 * - Clearing cached data
 */

// Default TTL in milliseconds (24 hours)
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

// Cache keys for different modules
export const CACHE_KEYS = {
  TABLES: 'cached_tables',
  ORDERS: 'cached_orders',
  MENU_ITEMS: 'cached_menu_items',
  CATEGORIES: 'cached_categories',
  STAFF: 'cached_staff',
  PAYMENTS: 'cached_payments',
  USERS: 'cached_users',
  RESTAURANT: 'cached_restaurant',
  ANALYTICS: 'cached_analytics',
};

// Interface for cached data with timestamp
interface CachedData<T> {
  data: T;
  timestamp: number;
}

export const cacheService = {
  /**
   * Store data in local storage with a timestamp
   * @param key Cache key
   * @param data Data to store
   */
  setCache<T>(key: string, data: T): void {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {

    }
  },

  /**
   * Get data from local storage if it exists and is not expired
   * @param key Cache key
   * @param ttl Time-to-live in milliseconds (default: 24 hours)
   * @returns The cached data or null if not found or expired
   */
  getCache<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
    try {
      const cachedDataString = localStorage.getItem(key);
      if (!cachedDataString) return null;

      const cachedData = JSON.parse(cachedDataString) as CachedData<T>;
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cachedData.timestamp > ttl) {
        // Cache is expired, remove it
        localStorage.removeItem(key);
        return null;
      }
      
      return cachedData.data;
    } catch (error) {

      return null;
    }
  },

  /**
   * Check if cache exists and is not expired
   * @param key Cache key
   * @param ttl Time-to-live in milliseconds (default: 24 hours)
   * @returns True if cache exists and is not expired
   */
  isCacheValid(key: string, ttl: number = DEFAULT_TTL): boolean {
    try {
      const cachedDataString = localStorage.getItem(key);
      if (!cachedDataString) return false;

      const cachedData = JSON.parse(cachedDataString) as CachedData<unknown>;
      const now = Date.now();
      
      return now - cachedData.timestamp <= ttl;
    } catch (error) {

      return false;
    }
  },

  /**
   * Clear cache for a specific key
   * @param key Cache key
   */
  clearCache(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {

    }
  },

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {

    }
  },
};