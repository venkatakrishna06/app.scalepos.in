import { useCallback } from 'react';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as ErrorResponse;
      
      if (data?.errors) {
        const errorMessages = Object.values(data.errors).flat();
        return errorMessages.join(', ');
      }
      
      return data?.message || error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }, []);

  return { handleError };
};