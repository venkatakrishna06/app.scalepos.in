
import { ViewOrdersDialog as ViewOrdersDialogComponent } from '@/components/composed/view-orders-dialog';
import { Order } from '@/types';

interface ViewOrdersDialogProps {
    open: boolean;
    onClose: () => void;
    tableId: number;
    onPayment: (order: Order) => void;
}

export function ViewOrdersDialog({
    open,
    onClose,
    tableId,
    onPayment,
}: ViewOrdersDialogProps) {
    return (
        <ViewOrdersDialogComponent
            open={open}
            onClose={onClose}
            tableId={tableId}
            onPayment={onPayment}
        />
    );
}
