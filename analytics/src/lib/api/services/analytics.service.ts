import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';

export interface AnalyticsEmbedResponse {
  embed_url: string;
  success: boolean;
  error?: string;
}

export const analyticsService = {
  getEmbedUrl: async (dashboard: string): Promise<AnalyticsEmbedResponse> => {
    try {
      const response = await api.post<AnalyticsEmbedResponse>('/api/analytics/get-embed-url', { dashboard });
      return response.data;
    } catch (error) {
      console.error('Error fetching embed URL:', error);
      return {
        success: false,
        embed_url: '',
        error: 'Failed to fetch embed URL'
      };
    }
  }
};