import React, {Component, ErrorInfo, ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {AlertTriangle} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 * 
 * @example
 * <ErrorBoundary
 *   onError={(error, info) => logErrorToService(error, info)}
 *   fallback={<p>Something went wrong</p>}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log the error to an error reporting service
    if (this.props.onError) {
      this.props.onError(error, info);
    } else {
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // If any of the resetKeys changed, reset the error boundary
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys[index])
    ) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">Something went wrong</h2>
          <p className="text-red-600 dark:text-red-400 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            variant="outline" 
            onClick={this.reset}
            className="border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/50"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A hook that lets you use the ErrorBoundary as a function component
 * 
 * @example
 * const MyComponent = () => {
 *   const { ErrorBoundary, error, resetError } = useErrorBoundary();
 *   
 *   return (
 *     <ErrorBoundary>
 *       <YourComponent />
 *     </ErrorBoundary>
 *   );
 * };
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<Props, 'children'> = {}
): React.FC<P> => {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;

  return WithErrorBoundary;
};
