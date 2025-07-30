
import { ServerOrderView as ServerOrderViewComponent } from '@/components/composed/ServerOrderView';
import { Order } from '@/types';
import { toast } from '@/lib/toast';

interface ServerOrderViewProps {
    orders: Order[];
    currentServer: string;
    onMarkItemAsServed: (orderId: number, itemId: number) => void;
    onMarkOrderAsPaid: (orderId: number) => void;
}

export function ServerOrderView({
    orders,
    currentServer,
    onMarkItemAsServed,
    onMarkOrderAsPaid
}: ServerOrderViewProps) {
    return (
        <ServerOrderViewComponent
            orders={orders}
            currentServer={currentServer}
            onMarkItemAsServed={onMarkItemAsServed}
            onMarkOrderAsPaid={onMarkOrderAsPaid}
            onPrintBill={(orderId) => toast.success(`Printing bill for order #${orderId}`)}
        />
    );
}
