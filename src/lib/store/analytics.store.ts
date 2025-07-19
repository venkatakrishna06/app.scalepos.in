import {create} from 'zustand';
import {analyticsService} from '@/lib/api/services/analytics.service';
import {AnalyticsParams, MenuItemAnalytics,} from '@/types/analytics';
import {toast} from '@/lib/toast';

interface AnalyticsState {
    // State
    menuItemAnalytics: MenuItemAnalytics[];
    loading: boolean;
    error: string | null;

    // API Actions
    fetchMenuItemAnalytics: (params: AnalyticsParams) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
    menuItemAnalytics: [],
    loading: false,
    error: null,


    fetchMenuItemAnalytics: async (params) => {
        try {
            set({loading: true, error: null});
            const data = await analyticsService.getMenuItemAnalytics(params);
            set({menuItemAnalytics: data});
        } catch (err) {

            const errorMessage = 'Failed to fetch menu item analytics';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    }


}));