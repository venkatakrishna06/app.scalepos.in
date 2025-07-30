
import { KitchenView as KitchenViewComponent } from '@/components/composed/KitchenView';
import { Order } from '@/types';

interface KitchenViewProps {
    orders: Order[];
    onItemStatusChange: (orderId: number, itemId: number, newStatus: string) => void;
}

export function KitchenView({ orders, onItemStatusChange }: KitchenViewProps) {
    return (
        <KitchenViewComponent
            orders={orders}
            onItemStatusChange={onItemStatusChange}
        />
    );
}
