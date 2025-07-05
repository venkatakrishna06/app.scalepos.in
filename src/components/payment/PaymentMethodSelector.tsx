import React from 'react';
import {AccessibleInput} from '@/components/ui/accessible-input';
import {Payment} from '@/types';

interface PaymentMethodSelectorProps {
  paymentMethod: Payment['payment_method'];
  setPaymentMethod: (method: Payment['payment_method']) => void;
  cashGiven: string;
  setCashGiven: (amount: string) => void;
  roundedAmount: number;
}

/**
 * Component for selecting payment method and entering cash amount
 */
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
  cashGiven,
  setCashGiven,
  roundedAmount,
}) => {
  // Calculate change amount if cash payment
  const cashGivenNumber = cashGiven ? parseFloat(cashGiven) : 0;
  const changeAmount = cashGivenNumber > roundedAmount ? cashGivenNumber - roundedAmount : 0;

  return (
    <div className="rounded-lg p-3">
      <h3 className="text-sm font-semibold mb-2">Payment Method</h3>
      <div className="space-y-2">
        {/* UPI Option */}
        <div className="flex items-center p-2 rounded-lg">
          <input
            type="radio"
            id="upi-payment"
            name="payment-method"
            className="mr-2"
            checked={paymentMethod === 'upi'}
            onChange={() => setPaymentMethod('upi')}
            aria-label="Pay with UPI"
          />
          <label htmlFor="upi-payment" className="flex-1 text-sm">UPI (Pay with UPI)</label>
        </div>
        
        {/* Card Option */}
        <div className="flex items-center p-2 rounded-lg">
          <input
            type="radio"
            id="card-payment"
            name="payment-method"
            className="mr-2"
            checked={paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
            aria-label="Pay with Credit/Debit Card"
          />
          <label htmlFor="card-payment" className="flex-1 text-sm">Card (Pay with Credit/Debit Card)</label>
        </div>

        {/* Cash Option */}
        <div className="flex items-center p-2 rounded-lg">
          <input
            type="radio"
            id="cash-payment"
            name="payment-method"
            className="mr-2"
            checked={paymentMethod === 'cash'}
            onChange={() => setPaymentMethod('cash')}
            aria-label="Pay with Cash"
          />
          <label htmlFor="cash-payment" className="flex-1 text-sm">Cash (Pay with Cash)</label>
        </div>

        {/* Cash amount input field */}
        {paymentMethod === 'cash' && (
          <div className="mt-2 ml-5">
            <AccessibleInput
              label="Cash Amount Given"
              hideLabel={false}
              type="text"
              placeholder="Enter Amount"
              value={cashGiven}
              onChange={(e) => {
                // Only allow positive numbers
                const value = e.target.value;
                if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
                  setCashGiven(value);
                }
              }}
              className="w-full h-8 text-sm"
            />

            {cashGiven && (
              <div className="mt-1 p-1 border-t">
                <div className="flex justify-between py-1 text-xs">
                  <span>Amount to Pay</span>
                  <span>₹{roundedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs">
                  <span>Cash Given</span>
                  <span>₹{cashGivenNumber > 0 ? cashGivenNumber.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between py-1 text-xs font-medium">
                  <span>Return Amount</span>
                  <span>₹{changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};