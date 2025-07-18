import React from 'react';
import {AccessibleButton} from '@/components/ui/accessible-button';
import {Order} from '@/types';

interface PaymentActionsProps {
  isSubmitting: boolean;
  onPrintBill: () => Promise<Order | null>;
  onPrintBillAndPayment: () => Promise<void>;
  onPayment: () => Promise<void>;
}

/**
 * Component for payment action buttons
 */
export const PaymentActions: React.FC<PaymentActionsProps> = ({
  isSubmitting,
  onPrintBill,
  onPrintBillAndPayment,
  onPayment,
}) => {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sticky bottom-0 bg-background pt-2">
      <AccessibleButton
        onClick={onPrintBill}
        className="w-full h-9 text-xs"
        disabled={isSubmitting}
        variant="outline"
        ariaLabel="Print bill without payment"
      >
        Print Bill
      </AccessibleButton>

      <AccessibleButton
        onClick={onPrintBillAndPayment}
        className="w-full h-9 text-xs"
        disabled={isSubmitting}
        variant="secondary"
        ariaLabel="Print bill and complete payment"
        isLoading={isSubmitting}
        loadingText="Processing..."
      >
        Print Bill & Complete Payment
      </AccessibleButton>

      <AccessibleButton
        onClick={onPayment}
        className="w-full h-9 text-xs font-medium"
        disabled={isSubmitting}
        ariaLabel="Complete payment without printing"
        isLoading={isSubmitting}
        loadingText="Processing..."
      >
        Complete Payment
      </AccessibleButton>
    </div>
  );
};
