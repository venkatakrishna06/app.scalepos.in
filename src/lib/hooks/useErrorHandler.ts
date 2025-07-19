import {useCallback} from 'react';
import {toast} from '@/lib/toast';
import {ErrorCategory, errorService} from '@/lib/services/error.service';

interface ErrorHandlerOptions {
    showToast?: boolean;
    defaultMessage?: string;
    context?: Record<string, unknown>;
    onError?: (error: Error) => void;
}

/**
 * Hook for consistent error handling across components
 *
 * This hook provides methods for:
 * - Handling errors with appropriate logging and user feedback
 * - Formatting error messages for display
 * - Creating error handlers for specific operations
 *
 * @example
 * const { handleError, createErrorHandler } = useErrorHandler();
 *
 * // Handle an error directly
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, { defaultMessage: 'Failed to perform operation' });
 * }
 *
 * // Create a reusable error handler for a specific operation
 * const handleSubmitError = createErrorHandler('Failed to submit form');
 *
 * try {
 *   await submitForm(data);
 * } catch (error) {
 *   handleSubmitError(error);
 * }
 */
export const useErrorHandler = () => {
    /**
     * Handle an error with appropriate logging and user feedback
     */
    const handleError = useCallback((
        error: unknown,
        options: ErrorHandlerOptions = {}
    ) => {
        const {
            showToast = true,
            defaultMessage = 'An unexpected error occurred',
            context,
            onError,
        } = options;

        // Convert to Error object if it's not already
        const errorObj = error instanceof Error ? error : new Error(String(error));

        // Categorize the error
        const category = errorService.categorizeError(errorObj);

        // Log the error
        errorService.logError(errorObj, category, context);

        // Show toast notification if enabled
        if (showToast) {
            const message = errorService.formatErrorMessage(errorObj, defaultMessage);

            // Use different toast variants based on error category
            switch (category) {
                case ErrorCategory.NETWORK:
                    toast.error('Network Error', {description: message});
                    break;
                case ErrorCategory.AUTHENTICATION:
                    toast.error('Authentication Error', {description: message});
                    break;
                case ErrorCategory.AUTHORIZATION:
                    toast.error('Access Denied', {description: message});
                    break;
                case ErrorCategory.VALIDATION:
                    toast.error('Validation Error', {description: message});
                    break;
                case ErrorCategory.API:
                    toast.error('API Error', {description: message});
                    break;
                default:
                    toast.error('Error', {description: message});
            }
        }

        // Call the onError callback if provided
        if (onError) {
            onError(errorObj);
        }

        return errorObj;
    }, []);

    /**
     * Create a reusable error handler for a specific operation
     */
    const createErrorHandler = useCallback(
        (defaultMessage: string, options: Omit<ErrorHandlerOptions, 'defaultMessage'> = {}) => {
            return (error: unknown) => handleError(error, {defaultMessage, ...options});
        },
        [handleError]
    );

    /**
     * Format an error message for display
     */
    const formatErrorMessage = useCallback(
        (error: unknown, defaultMessage = 'An unexpected error occurred') => {
            return errorService.formatErrorMessage(error, defaultMessage);
        },
        []
    );

    /**
     * Create an async function that handles its own errors
     */
    const withErrorHandling = useCallback(
        <T, Args extends unknown[]>(
            fn: (...args: Args) => Promise<T>,
            options: ErrorHandlerOptions = {}
        ) => {
            return async (...args: Args): Promise<T> => {
                try {
                    return await fn(...args);
                } catch (error) {
                    handleError(error, options);
                    throw error; // Re-throw to allow the caller to handle it if needed
                }
            };
        },
        [handleError]
    );

    return {
        handleError,
        createErrorHandler,
        formatErrorMessage,
        withErrorHandling,
    };
};
