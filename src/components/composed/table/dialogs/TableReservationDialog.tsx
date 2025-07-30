
import { TableReservationDialog as TableReservationDialogComponent } from '@/components/composed/table-reservation-dialog';
import { Table } from '@/types';

interface TableReservationDialogProps {
    open: boolean;
    onClose: () => void;
    table: Table;
}

export function TableReservationDialog({
    open,
    onClose,
    table,
}: TableReservationDialogProps) {
    return (
        <TableReservationDialogComponent
            open={open}
            onClose={onClose}
            table={table}
        />
    );
}
