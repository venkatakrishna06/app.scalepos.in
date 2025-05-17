import axios from 'axios';
import {tokenService} from '@/lib/services/token.service';
import {handleApiError, showToast} from '@/lib/toast';
import {authService} from '@/lib/api/services/auth.service';

// Flag to prevent multiple simultaneous refresh token requests
let isRefreshing = false;
// Queue of requests to be executed after token refresh
let refreshSubscribers: Array<(token: string) => void> = [];

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Function to add a request to the queue
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to execute all queued requests with the new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

api.interceptors.request.use(
  async (config) => {
    // Token refresh is now handled by the auth-guard component on a schedule

    // If a token refresh is in progress, queue this request
    if (isRefreshing && tokenService.isTokenValid()) {
      console.log('[Axios] Token refresh in progress, queuing request');

      // Return a promise that resolves when the token refresh is complete
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          // Update the Authorization header with the new token
          config.headers['Authorization'] = `Bearer ${token}`;
          resolve(config);
        });
      });
    }

    // Otherwise, proceed with the request as normal
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

      if (isRefreshing) {
        // If a token refresh is already in progress, add this request to the queue
        try {
          const token = await new Promise<string>((resolve) => {
            subscribeTokenRefresh((token: string) => {
              resolve(token);
            });
          });

          // Set the auth header for this request
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Start a new token refresh process
      isRefreshing = true;

      try {
        // Check if we should have a refresh token
        const hasRefreshToken = tokenService.getRefreshToken();
        if (!hasRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token using authService
        console.log('[Axios] Refreshing token after 401');
        const response = await authService.refreshToken();
        console.log('[Axios] Refresh response after 401 received');

        // Extract token and refreshToken from response data
        const token = response.token;
        const newRefreshToken = response.refreshToken;

        // Update tokens in storage and auth headers
        tokenService.setToken(token);
        if (newRefreshToken) {
          // This now just sets a flag indicating we have a refresh token
          // The actual token is stored as an HttpOnly cookie by the server
          tokenService.setRefreshToken(newRefreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Execute all queued requests with the new token
        onTokenRefreshed(token);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        tokenService.clearTokens();
        refreshSubscribers = []; // Clear the queue

        // Show error toast for authentication failure
        showToast('error', 'Your session has expired. Please log in again.');

        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // Handle other error types (400, 500, etc.)
    if (error.response && error.response.status !== 401) {
      // Don't handle 401 errors here as they're handled above
      handleApiError(error, `Request failed with status ${error.response.status}`);
    }

    return Promise.reject(error);
  }
);
