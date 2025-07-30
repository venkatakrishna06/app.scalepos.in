import {CreateOrderDialog as CreateOrderDialogComponent} from '@/components/composed/create-order-dialog';
import {Order} from '@/types';

interface CreateOrderDialogProps {
    open: boolean;
    onClose: () => void;
    table_id: number;
    existingOrder?: Order; 
}

export function CreateOrderDialog({
                                      open,
                                      onClose,
                                      table_id,
                                      existingOrder,
                                  }: CreateOrderDialogProps) {
    return (
        <CreateOrderDialogComponent
            open={open}
            onClose={onClose}
            table_id={table_id}
            existingOrder={existingOrder}
        />
    );
}
