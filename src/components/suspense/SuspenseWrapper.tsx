import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * A wrapper component that combines Suspense and ErrorBoundary
 * to handle both loading and error states for lazy-loaded components.
 * 
 * @example
 * <SuspenseWrapper>
 *   <LazyLoadedComponent />
 * </SuspenseWrapper>
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  onError,
}) => {
  // Default loading fallback
  const defaultFallback = (
    <div className="flex items-center justify-center h-[200px] w-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};