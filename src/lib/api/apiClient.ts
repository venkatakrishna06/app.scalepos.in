import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { errorService, ErrorCategory } from '@/lib/services/error.service';
import { toast } from '@/lib/toast';

// Configuration for the API client
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  withCredentials?: boolean;
}

// Default configuration
const defaultConfig: ApiClientConfig = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  withCredentials: true,
};

/**
 * Creates an API client with interceptors for consistent error handling,
 * request cancellation, and retry logic.
 * 
 * @param config Configuration for the API client
 * @returns An Axios instance configured with interceptors
 */
export const createApiClient = (config: Partial<ApiClientConfig> = {}): AxiosInstance => {
  const finalConfig: ApiClientConfig = { ...defaultConfig, ...config };

  // Create the Axios instance
  const client = axios.create({
    baseURL: finalConfig.baseURL,
    timeout: finalConfig.timeout,
    withCredentials: finalConfig.withCredentials,
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add AbortController for request cancellation
      const controller = new AbortController();
      config.signal = controller.signal;

      // Store the controller in the request config for later access
      config.abortController = controller;

      // Add authentication token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      // Get the original request config
      const originalRequest = error.config as AxiosRequestConfig & { 
        _retry?: number;
        abortController?: AbortController;
      };

      // If the request was cancelled, don't retry
      if (axios.isCancel(error)) {
        errorService.logError(error, ErrorCategory.NETWORK, { 
          message: 'Request cancelled',
          url: originalRequest?.url,
        });
        return Promise.reject(new Error('Request cancelled'));
      }

      // Handle network errors
      if (error.message === 'Network Error') {
        errorService.logError(error, ErrorCategory.NETWORK, { 
          url: originalRequest?.url,
        });
        toast.error('Network Error', { 
          description: 'Please check your internet connection and try again.' 
        });
        return Promise.reject(error);
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        errorService.logError(error, ErrorCategory.NETWORK, { 
          message: 'Request timeout',
          url: originalRequest?.url,
        });
        toast.error('Request Timeout', { 
          description: 'The server took too long to respond. Please try again.' 
        });
        return Promise.reject(error);
      }

      // Get the response status
      const status = error.response?.status;

      // Handle authentication errors
      if (status === 401) {
        errorService.logError(error, ErrorCategory.AUTHENTICATION, { 
          url: originalRequest?.url,
        });

        // Clear auth token and redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';

        return Promise.reject(error);
      }

      // Handle authorization errors
      if (status === 403) {
        errorService.logError(error, ErrorCategory.AUTHORIZATION, { 
          url: originalRequest?.url,
        });
        toast.error('Access Denied', { 
          description: 'You do not have permission to perform this action.' 
        });
        return Promise.reject(error);
      }

      // Handle validation errors
      if (status === 422) {
        errorService.logError(error, ErrorCategory.VALIDATION, { 
          url: originalRequest?.url,
          data: error.response?.data,
        });

        // Extract validation errors from the response
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessage = Object.values(validationErrors).flat().join(', ');
          toast.error('Validation Error', { description: errorMessage });
        } else {
          toast.error('Validation Error', { 
            description: 'Please check your input and try again.' 
          });
        }

        return Promise.reject(error);
      }

      // Handle server errors with retry logic
      if (status >= 500 && status < 600) {
        // Initialize retry count
        originalRequest._retry = originalRequest._retry || 0;

        // Check if we should retry
        if (originalRequest._retry < finalConfig.retries) {
          originalRequest._retry++;

          // Log the retry attempt
          console.info(`Retrying request (${originalRequest._retry}/${finalConfig.retries}): ${originalRequest.url}`);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));

          // Retry the request
          return client(originalRequest);
        }

        // Log the error after all retries have failed
        errorService.logError(error, ErrorCategory.API, { 
          url: originalRequest?.url,
          retries: originalRequest._retry,
        });

        toast.error('Server Error', { 
          description: 'Something went wrong on our end. Please try again later.' 
        });
      }

      // Handle all other errors
      errorService.logError(error, ErrorCategory.UNEXPECTED, { 
        url: originalRequest?.url,
        status,
      });

      // Show a generic error message for unhandled errors
      if (!toast.isActive('api-error')) {
        toast.error('Error', { 
          id: 'api-error',
          description: error.response?.data?.message || 'An unexpected error occurred. Please try again.' 
        });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create and export a default API client instance
export const apiClient = createApiClient();

/**
 * Creates a cancellable request
 * 
 * @param requestFn Function that makes the API request
 * @returns Object with execute and cancel methods
 */
export const createCancellableRequest = <T>(
  requestFn: (signal: AbortSignal) => Promise<T>
) => {
  const controller = new AbortController();

  return {
    execute: () => requestFn(controller.signal),
    cancel: () => controller.abort(),
  };
};
