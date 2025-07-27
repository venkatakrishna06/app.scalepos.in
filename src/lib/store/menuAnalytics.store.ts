import { create } from 'zustand';
import { MenuItemAnalytics } from '@/types/analytics';
import { analyticsService } from '@/lib/api/services/analytics.service';

interface MenuAnalyticsState {
    // Cache for favorite menu items
    favoriteItems: MenuItemAnalytics[];
    isLoading: boolean;
    lastFetched: number | null;
    
    // Actions
    fetchFavoriteItems: () => Promise<MenuItemAnalytics[]>;
    getFavoriteItems: () => Promise<MenuItemAnalytics[]>;
}

/**
 * Store for caching menu analytics data
 * 
 * This store handles caching of favorite menu items to avoid
 * unnecessary API calls to /api/v1/analytics/menu-items
 */
export const useMenuAnalyticsStore = create<MenuAnalyticsState>((set, get) => ({
    // Initial state
    favoriteItems: [],
    isLoading: false,
    lastFetched: null,
    
    // Fetch favorite items directly from API
    fetchFavoriteItems: async () => {
        try {
            set({ isLoading: true });
            
            // Fetch the most ordered items, limit to 10, sort by quantity_sold in descending order
            const params = {
                limit: 10,
                sort_by: 'quantity_sold',
                order: 'desc' as const
            };
            
            const menuItemAnalytics = await analyticsService.getMenuItemAnalytics(params);
            
            // Update the store with fetched data
            set({ 
                favoriteItems: menuItemAnalytics,
                lastFetched: Date.now(),
                isLoading: false
            });
            
            return menuItemAnalytics;
        } catch (error) {
            // Reset loading state on error
            set({ isLoading: false });
            throw error;
        }
    },
    
    // Get favorite items with caching (30 minute cache)
    getFavoriteItems: async () => {
        const { favoriteItems, lastFetched, fetchFavoriteItems } = get();
        
        // If we have cached data and it's less than 30 minutes old, use it
        const cacheTime = 30 * 60 * 1000; // 30 minutes in milliseconds
        if (favoriteItems.length > 0 && lastFetched && (Date.now() - lastFetched < cacheTime)) {
            return favoriteItems;
        }
        
        // Otherwise fetch fresh data
        return fetchFavoriteItems();
    }
}));