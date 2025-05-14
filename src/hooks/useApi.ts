import {useCallback, useState} from 'react';
import {ApiError, handleApiError, toast} from '@/lib/toast';

/**
 * Custom hook for making API calls with consistent loading, error handling, and toast messages
 * @param apiFunction The API function to call
 * @param options Configuration options
 * @returns An object with loading state, error state, and a function to execute the API call
 */
export function useApi<T, P extends unknown[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError | Error) => void;
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  } = {}
) {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'An error occurred',
    showSuccessToast = false,
    showErrorToast = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        setData(result);

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err: unknown) {
        const error = err as ApiError | Error;
        setError(error);

        if (showErrorToast) {
          handleApiError(error, errorMessage);
        }

        if (onError) {
          onError(error);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast]
  );

  return {
    loading,
    error,
    data,
    execute,
    reset: useCallback(() => {
      setData(null);
      setError(null);
    }, []),
  };
}
