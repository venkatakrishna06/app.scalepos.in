import React from 'react';
import {Order} from '@/types';

interface OrderSummaryProps {
    order: Order | null;
    draftOrder?: Omit<Order, 'id'>;
    gstDetails: {
        subTotal: number;
        sgstAmount: number;
        cgstAmount: number;
        sgstRate: number;
        cgstRate: number;
        totalGstAmount: number;
        totalWithGst: number;
    };
    roundedAmount: number;
    roundingDifference: number;
}

/**
 * Component for displaying order summary including items and totals
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
                                                              order,
                                                              draftOrder,
                                                              gstDetails,
                                                              roundedAmount,
                                                              roundingDifference,
                                                          }) => {
    // Get items from either current order or draft order
    const items = order?.items || draftOrder?.items || [];
    const filteredItems = items.filter(item => item.status !== 'cancelled');

    return (
        <div className="rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">Order Items ({filteredItems.length})</h3>
            <div className="space-y-0 max-h-[25vh] md:max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-3 text-xs">No items in this order</p>
                ) : (
                    filteredItems.map((item) => (
                        <div
                            key={item.id || `draft-${item.menu_item_id}`}
                            className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                        >
                            <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                            </div>
                            <span className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-3 pt-2 border-t">
                <div className="">
                    <div className="flex justify-between py-1">
                        <span className="text-xs text-muted-foreground">Sub Total</span>
                        <span className="text-xs font-medium">₹{gstDetails.subTotal.toFixed(2)}</span>
                    </div>
                    {gstDetails.sgstAmount > 0 && (
                        <div className="flex justify-between py-1">
                            <span className="text-xs text-muted-foreground">SGST ({gstDetails.sgstRate}%)</span>
                            <span className="text-xs font-medium">₹{gstDetails.sgstAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {gstDetails.cgstAmount > 0 && (
                        <div className="flex justify-between py-1">
                            <span className="text-xs text-muted-foreground">CGST ({gstDetails.cgstRate}%)</span>
                            <span className="text-xs font-medium">₹{gstDetails.cgstAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-1">
                        <span className="text-xs text-muted-foreground">Rounding Adjustment</span>
                        <span className="text-xs font-medium">₹{roundingDifference.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 pt-1 border-t border-border/50">
                        <span className="text-sm font-medium">Total Amount</span>
                        <span className="text-sm font-bold">₹{roundedAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};