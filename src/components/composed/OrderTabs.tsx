import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types';
import { OrderDetails } from './OrderDetails';

interface OrderTabsProps {
    orders: Order[];
    activeOrderId: number | null;
    setActiveOrderId: (id: number) => void;
    onPayment?: (order: Order) => void;
    handleQuantityChange: (orderId: number, itemId: number, delta: number, currentQuantity: number) => Promise<void>;
    handleItemStatusChange: (orderId: number, itemId: number, newStatus: Order["items"][0]["status"]) => Promise<void>;
    handleCancelItem: (orderId: number, itemId: number) => Promise<void>;
    processingItemId: number | null;
    getOrderTotal: (order: Order) => number;
    getGstDetails: (order: Order) => {
        subTotal: number;
        sgstRate: number;
        cgstRate: number;
        sgstAmount: number;
        cgstAmount: number;
        totalGstAmount: number;
    };
    getStatusBadgeClass: (status: string) => string;
}

export const OrderTabs: React.FC<OrderTabsProps> = ({
    orders,
    activeOrderId,
    setActiveOrderId,
    onPayment,
    handleQuantityChange,
    handleItemStatusChange,
    handleCancelItem,
    processingItemId,
    getOrderTotal,
    getGstDetails,
    getStatusBadgeClass,
}) => {
    if (orders.length === 1) {
        return (
            <OrderDetails
                order={orders[0]}
                onPayment={onPayment}
                handleQuantityChange={handleQuantityChange}
                handleItemStatusChange={handleItemStatusChange}
                handleCancelItem={handleCancelItem}
                processingItemId={processingItemId}
                getOrderTotal={getOrderTotal}
                getGstDetails={getGstDetails}
                getStatusBadgeClass={getStatusBadgeClass}
            />
        );
    }

    return (
        <Tabs
            defaultValue={activeOrderId?.toString()}
            onValueChange={(value) => setActiveOrderId(parseInt(value))}
            className="w-full"
        >
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {orders.map((order) => (
                    <TabsTrigger key={order.id} value={order.id.toString()}>
                        Order #{order.id}
                    </TabsTrigger>
                ))}
            </TabsList>

            {orders.map((order) => (
                <TabsContent key={order.id} value={order.id.toString()}>
                    <OrderDetails
                        order={order}
                        onPayment={onPayment}
                        handleQuantityChange={handleQuantityChange}
                        handleItemStatusChange={handleItemStatusChange}
                        handleCancelItem={handleCancelItem}
                        processingItemId={processingItemId}
                        getOrderTotal={getOrderTotal}
                        getGstDetails={getGstDetails}
                        getStatusBadgeClass={getStatusBadgeClass}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
};
