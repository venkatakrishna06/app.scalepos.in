import {toast as sonnerToast} from 'sonner';


// Define toast options interface
interface ToastOptions {
  description?: string;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  id?: string;
}

/**
 * Centralized toast notification system
 * This provides a consistent interface for displaying toast messages throughout the application
 */
export const toast = {
  /**
   * Show a success toast message
   * @param message The main message to display
   * @param options Additional options for the toast
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, options);
  },

  /**
   * Show an error toast message
   * @param message The main message to display
   * @param options Additional options for the toast
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, options);
  },

  /**
   * Show a warning toast message
   * @param message The main message to display
   * @param options Additional options for the toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, options);
  },

  /**
   * Show an info toast message
   * @param message The main message to display
   * @param options Additional options for the toast
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, options);
  },

  /**
   * Show a custom toast message
   * @param message The main message to display
   * @param options Additional options for the toast
   */
  custom: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, options);
  },

  /**
   * Dismiss a specific toast by ID
   * @param toastId The ID of the toast to dismiss
   */
  dismiss: (toastId: string) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all currently displayed toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss();
  }
};

// Define a type for API errors
export interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
  [key: string]: unknown;
}

/**
 * Create a toast notification for API errors
 * @param error The error object from the API
 * @param fallbackMessage A fallback message to display if the error doesn't have a message
 */
export const handleApiError = (error: ApiError, fallbackMessage: string = 'An error occurred') => {
  console.error('API Error:', error);

  // Extract error message from different error formats
  const errorMessage = 
    error?.response?.data?.message || 
    error?.response?.data?.error || 
    error?.message || 
    fallbackMessage;

  toast.error(errorMessage);
  return errorMessage;
};
