/**
 * Error service for centralized error handling and logging
 * 
 * This service provides methods for:
 * - Logging errors to the console or external services
 * - Formatting error messages for display
 * - Categorizing errors for better reporting
 */

// Error categories for better organization and reporting
export enum ErrorCategory {
  API = 'API Error',
  AUTHENTICATION = 'Authentication Error',
  AUTHORIZATION = 'Authorization Error',
  VALIDATION = 'Validation Error',
  NETWORK = 'Network Error',
  UNEXPECTED = 'Unexpected Error',
}

// Interface for structured error logging
interface ErrorLogData {
  message: string;
  category: ErrorCategory;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

// Configuration for error logging
interface ErrorServiceConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  remoteLoggingEndpoint?: string;
  environment: 'development' | 'production' | 'test';
}

// Default configuration
const defaultConfig: ErrorServiceConfig = {
  enableConsoleLogging: true,
  enableRemoteLogging: false,
  environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
};

class ErrorService {
  private config: ErrorServiceConfig;

  constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Log an error with structured data
   */
  public logError(error: Error | unknown, category: ErrorCategory = ErrorCategory.UNEXPECTED, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const logData: ErrorLogData = {
      message: errorObj.message,
      category,
      timestamp: new Date().toISOString(),
      context,
      stack: errorObj.stack,
    };


    // Log to remote service in production
    if (this.config.enableRemoteLogging && this.config.remoteLoggingEndpoint) {
      this.logToRemoteService(logData);
    }
  }

  /**
   * Format an error message for display to users
   */
  public formatErrorMessage(error: Error | unknown, defaultMessage = 'An unexpected error occurred'): string {
    if (error instanceof Error) {
      return error.message || defaultMessage;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return defaultMessage;
  }

  /**
   * Categorize an error based on its type or message
   */
  public categorizeError(error: Error | unknown): ErrorCategory {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        return ErrorCategory.NETWORK;
      }
      
      if (message.includes('authentication') || message.includes('login') || message.includes('token')) {
        return ErrorCategory.AUTHENTICATION;
      }
      
      if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
        return ErrorCategory.AUTHORIZATION;
      }
      
      if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
        return ErrorCategory.VALIDATION;
      }
      
      if (message.includes('api') || message.includes('endpoint') || message.includes('server')) {
        return ErrorCategory.API;
      }
    }
    
    return ErrorCategory.UNEXPECTED;
  }

  private logToRemoteService(logData: ErrorLogData): void {
    if (!this.config.remoteLoggingEndpoint) {
      return;
    }

    // In a real implementation, this would send the error to a service like Sentry, LogRocket, etc.
    // For now, we'll just simulate it
    try {
      // This would be an actual API call in a real implementation
      console.info(`[Remote Logging] Would send error to ${this.config.remoteLoggingEndpoint}:`, logData);

      // Example implementation with fetch:
      /*
      fetch(this.config.remoteLoggingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logData,
          environment: this.config.environment,
        }),
      });
      */
    } catch (e) {
      // Don't let the error logger throw errors
      console.error('Failed to send error to remote service:', e);
    }
  }
}

// Export a singleton instance
export const errorService = new ErrorService();