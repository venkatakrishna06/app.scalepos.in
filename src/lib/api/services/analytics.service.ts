import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {AnalyticsParams, MenuItemAnalytics,} from '@/types/analytics';

// Define error type for better type safety
interface ApiErrorResponse {
    response?: {
        data?: {
            error?: {
                type?: string;
                code?: string;
                message?: string;
                details?: Record<string, unknown>;
                request_id?: string;
            };
        };
    };
}

// Helper function to handle API errors
const handleApiError = (error: ApiErrorResponse | Error, defaultMessage: string) => {
    if ('response' in error && error.response?.data?.error) {
        const apiError = error.response.data.error;
        throw new Error(apiError.message || defaultMessage);
    }
    throw new Error(defaultMessage);
};

export const analyticsService = {

    getMenuItemAnalytics: async (params: AnalyticsParams) => {
        try {
            const response = await api.get<MenuItemAnalytics[]>(API_ENDPOINTS.ANALYTICS.MENU_ITEMS, {params});
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to fetch menu item analytics');
            return [];
        }
    },
};
