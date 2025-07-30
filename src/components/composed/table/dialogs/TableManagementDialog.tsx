import {TableManagementDialog as TableManagementDialogComponent} from '@/components/composed/table-management-dialog';
import {Table} from '@/types';

interface TableManagementDialogProps {
    open: boolean;
    onClose: () => void;
    action: 'add' | 'merge' | 'split' | null;
    selectedTable?: Table;
}

export function TableManagementDialog({
                                          open,
                                          onClose,
                                          action,
                                          selectedTable
                                      }: TableManagementDialogProps) {
    return (
        <TableManagementDialogComponent
            open={open}
            onClose={onClose}
            action={action}
            selectedTable={selectedTable}
        />
    );
}
