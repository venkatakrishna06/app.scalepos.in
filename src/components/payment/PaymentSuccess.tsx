import React from 'react';
import {CheckCircle} from 'lucide-react';
import {AccessibleButton} from '@/components/ui/accessible-button';

interface PaymentSuccessProps {
  onClose: () => void;
}

/**
 * Component for displaying payment success message
 */
export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative mb-2">
        <div className="absolute -inset-2 rounded-full bg-green-100/50 animate-pulse"></div>
        <div className="absolute -inset-4 rounded-full bg-green-50/30 animate-pulse animation-delay-200"></div>
        <div className="rounded-full bg-green-100 p-3 relative">
          <CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-base font-semibold text-center">Payment Complete!</p>
      <p className="mt-2 text-xs text-muted-foreground text-center max-w-md">
        Thank you for your payment. Your order has been successfully processed.
      </p>
      <AccessibleButton
        className="mt-4 px-4 h-8 text-xs font-medium"
        onClick={onClose}
        ariaLabel="Close payment dialog"
      >
        Close
      </AccessibleButton>
    </div>
  );
};