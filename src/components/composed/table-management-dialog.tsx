import {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {toast} from '@/lib/toast';
import {Table} from '@/types';
import {useCreateTable, useMergeTables, useSplitTable, useTables} from '@/api/tables';

interface TableManagementDialogProps {
    open: boolean;
    onClose: () => void;
    action: 'add' | 'merge' | 'split';
    selectedTable?: Table;
}

const addTableSchema = z.object({
    capacity: z.number()
        .min(1, 'Capacity must be at least 1')
        .max(20, 'Capacity cannot exceed 20'),
});

const splitTableSchema = z.object({
    capacity: z.number()
        .min(1, 'New capacity must be at least 1'),
});

type AddTableFormData = z.infer<typeof addTableSchema>;
type SplitTableFormData = z.infer<typeof splitTableSchema>;

export function TableManagementDialog({
                                          open,
                                          onClose,
                                          action,
                                          selectedTable,
                                      }: TableManagementDialogProps) {
    const {data: tables = []} = useTables();
    const createTableMutation = useCreateTable();
    const mergeTablesMutation = useMergeTables();
    const splitTableMutation = useSplitTable();
    const [selectedTables, setSelectedTables] = useState<number[]>([]);

    const addTableForm = useForm<AddTableFormData>({
        resolver: zodResolver(addTableSchema),
        defaultValues: {
            capacity: 4,
        },
    });

    const splitTableForm = useForm<SplitTableFormData>({
        resolver: zodResolver(splitTableSchema),
        defaultValues: {
            capacity: selectedTable ? Math.floor(selectedTable.capacity / 2) : 4,
        },
        context: {
            maxCapacity: selectedTable?.capacity || 0,
        },
    });

    useEffect(() => {
        if (!open) {
            setSelectedTables([]);
            addTableForm.reset({capacity: 4});
            splitTableForm.reset({
                capacity: selectedTable ? Math.floor(selectedTable.capacity / 2) : 4,
            });
        }
    }, [open, action, selectedTable]);

    const handleAction = async () => {
        try {
            switch (action) {
                case 'add':
                    await addTableForm.handleSubmit(async (values) => {
                        const maxTableNumber = Math.max(...tables.map((t) => t.table_number), 0);
                        await createTableMutation.mutateAsync({
                            table_number: maxTableNumber + 1,
                            capacity: values.capacity,
                            status: 'available',
                        });
                    })();
                    onClose();
                    break;

                case 'merge':
                    if (selectedTables.length < 2) {
                        toast.error('Please select at least 2 tables to merge');
                        return;
                    }
                    await mergeTablesMutation.mutateAsync(selectedTables);
                    toast.success('Tables merged successfully');
                    onClose();
                    break;

                case 'split':
                    if (!selectedTable) {
                        toast.error('No table selected for splitting');
                        return;
                    }
                    await splitTableForm.handleSubmit(async (values) => {
                        if (values.capacity >= selectedTable.capacity) {
                            toast.error('New capacity must be less than current capacity');
                            return;
                        }
                        await splitTableMutation.mutateAsync({id: selectedTable.id, capacity: values.capacity});
                    })();
                    toast.success('Table split successfully');
                    onClose();
                    break;
            }
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleTableSelection = (tableId: number) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        );
    };

    const availableTables = tables.filter((t) => t.status === 'available');

    return (
        <Dialog open={open}>
            <DialogContent onClose={onClose}>
                <DialogHeader>
                    <DialogTitle>
                        {action === 'add'
                            ? 'Add New Table'
                            : action === 'merge'
                                ? 'Merge Tables'
                                : 'Split Table'}
                    </DialogTitle>
                    <DialogDescription>
                        {action === 'add'
                            ? 'Create a new table with specified capacity'
                            : action === 'merge'
                                ? 'Select multiple tables to merge them into one'
                                : 'Split the selected table into two separate tables'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {action === 'add' && (
                        <Form {...addTableForm}>
                            <form onSubmit={addTableForm.handleSubmit(handleAction)} className="space-y-4">
                                <FormField
                                    control={addTableForm.control}
                                    name="capacity"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Table Capacity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Enter the number of seats (1-20)
                                            </FormDescription>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={createTableMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={createTableMutation.isPending}
                                        loadingText="Processing..."
                                    >
                                        Add Table
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}

                    {action === 'merge' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Select Tables to Merge</Label>
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {availableTables.map((table) => (
                                        <Button
                                            key={table.id}
                                            variant={
                                                selectedTables.includes(table.id)
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => handleTableSelection(table.id)}
                                            className="h-20"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-lg font-semibold">
                                                    Table {table.table_number}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    Capacity: {table.capacity}
                                                </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                                {availableTables.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        No available tables to merge
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={mergeTablesMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAction}
                                    disabled={selectedTables.length < 2}
                                    loading={mergeTablesMutation.isPending}
                                    loadingText="Processing..."
                                >
                                    Merge Tables
                                </Button>
                            </div>
                        </div>
                    )}

                    {action === 'split' && selectedTable && (
                        <Form {...splitTableForm}>
                            <form onSubmit={splitTableForm.handleSubmit(handleAction)} className="space-y-4">
                                <div className="mb-6 rounded-lg border bg-muted/50 p-4">
                                    <p className="text-sm font-medium">Current Table Details</p>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        <p>Table Number: {selectedTable.table_number}</p>
                                        <p>Current Capacity: {selectedTable.capacity}</p>
                                    </div>
                                </div>

                                <FormField
                                    control={splitTableForm.control}
                                    name="capacity"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>New Table Capacity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={selectedTable.capacity - 1}
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                The original table will
                                                keep {selectedTable.capacity - (field.value || 0)} seats
                                            </FormDescription>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={splitTableMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={splitTableMutation.isPending}
                                        loadingText="Processing..."
                                    >
                                        Split Table
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
