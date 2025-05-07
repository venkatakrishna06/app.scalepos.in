import axios from 'axios';
import { tokenService } from '@/lib/services/token.service';
// Import kept for when refresh functionality is re-enabled
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { API_ENDPOINTS } from './endpoints';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      // Add token to all requests
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Temporarily disabled token refresh
      // try {
      //   // Try to refresh the token
      //   const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
      //   const { token } = response.data;
      //
      //   // Update token in storage and auth headers
      //   tokenService.setToken(token);
      //   api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      //
      //   // Retry the original request
      //   return api(originalRequest);
      // } catch (refreshError) {
      //   // If refresh fails, clear tokens and redirect to login
      //   tokenService.clearTokens();
      //   window.location.href = '/login';
      //   return Promise.reject(refreshError);
      // }

      // Just clear tokens and redirect to login
      tokenService.clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
