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

// Define a type for API errors based on the specified structure
export interface ApiError {
  response?: {
    data?: {
      error?: {
        type?: string;
        code?: string;
        message?: string;
        details?: Record<string, string>;
        request_id?: string;
      };
    };
    status?: number;
  };
  message?: string;
  [key: string]: unknown;
}

// Keep track of recently shown toast messages to prevent duplicates
const recentToasts = new Map<string, number>();
const TOAST_DEBOUNCE_TIME = 3000; // 3 seconds

/**
 * Check if a toast message was recently shown
 * @param message The message to check
 * @returns True if the message was recently shown, false otherwise
 */
const wasRecentlyShown = (message: string): boolean => {
  const now = Date.now();
  const lastShown = recentToasts.get(message);

  if (lastShown && now - lastShown < TOAST_DEBOUNCE_TIME) {
    return true;
  }

  recentToasts.set(message, now);

  // Clean up old entries
  for (const [key, timestamp] of recentToasts.entries()) {
    if (now - timestamp > TOAST_DEBOUNCE_TIME) {
      recentToasts.delete(key);
    }
  }

  return false;
};

/**
 * Show a toast message if it wasn't recently shown
 * @param type The type of toast (success, error, etc.)
 * @param message The message to show
 * @param options Additional options for the toast
 * @returns The toast ID or undefined if the message was debounced
 */
export const showToast = (
  type: 'success' | 'error' | 'warning' | 'info' | 'custom',
  message: string,
  options?: ToastOptions
) => {
  if (wasRecentlyShown(message)) {
    return undefined;
  }

  switch (type) {
    case 'success':
      return toast.success(message, options);
    case 'error':
      return toast.error(message, options);
    case 'warning':
      return toast.warning(message, options);
    case 'info':
      return toast.info(message, options);
    case 'custom':
      return toast.custom(message, options);
  }
};

/**
 * Create a toast notification for API errors
 * @param error The error object from the API
 * @param fallbackMessage A fallback message to display if the error doesn't have a message
 */
export const handleApiError = (error: ApiError, fallbackMessage: string = 'An error occurred') => {
  console.error('API Error:', error);

  // Extract error message from the new error structure
  const errorData = error?.response?.data?.error;

  let errorMessage = fallbackMessage;
  let description: string | undefined;

  if (errorData) {
    // Use the message from the error structure
    errorMessage = errorData.message || fallbackMessage;

    // If there are field-specific errors, include them in the description
    if (errorData.details && Object.keys(errorData.details).length > 0) {
      description = Object.entries(errorData.details)
        .map(([field, message]) => `${field}: ${message}`)
        .join('\n');
    }

    // Include the error code in the console log for debugging
    if (errorData.code) {
      console.error(`Error code: ${errorData.code}`);
    }
  } else if (error?.message) {
    errorMessage = error.message;
  }

  // Show the error toast with the extracted message and description
  showToast('error', errorMessage, { description });

  return errorMessage;
};
