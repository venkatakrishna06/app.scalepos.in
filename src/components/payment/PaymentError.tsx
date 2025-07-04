import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PaymentErrorProps {
  error: string;
}

/**
 * Component for displaying payment error messages
 */
export const PaymentError: React.FC<PaymentErrorProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <p>{error}</p>
      </div>
    </div>
  );
};