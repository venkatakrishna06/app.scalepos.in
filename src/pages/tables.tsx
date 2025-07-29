import { useState } from 'react';
import { Merge, Plus, Search } from 'lucide-react';
import { TablesSkeleton } from '@/components/skeletons/tables-skeleton';
import { Button } from '@/components/ui/button';
import { CreateOrderDialog } from '@/components/composed/create-order-dialog';
import { PaymentDialog } from '@/components/composed/payment-dialog';
import { TableManagementDialog } from '@/components/composed/table-management-dialog';
import { ViewOrdersDialog } from '@/components/composed/view-orders-dialog';
import { TableReservationDialog } from '@/components/composed/table-reservation-dialog';
import { Order, Table } from '@/types';
import { toast } from '@/lib/toast';
import { TableCard } from '@/components/composed/tableCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterDropdownContainer } from '@/components/composed/FilterDropdownContainer';
import { useTables, useDeleteTable, useUpdateTable } from '@/api/tables';
import { useOrders } from '@/api/orders';

export default function Tables() {
    const { data: tables = [], isLoading: isLoadingTables, isError: isErrorTables, error: tablesErrorMessage } = useTables();
    const deleteTableMutation = useDeleteTable();
    const updateTableMutation = useUpdateTable();
    const { data: orders = [], isLoading: isLoadingOrders, isError: isErrorOrders, error: ordersErrorMessage } = useOrders();

    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isNewOrder, setIsNewOrder] = useState(false);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showOrdersDialog, setShowOrdersDialog] = useState(false);
    const [tableManagementAction, setTableManagementAction] = useState<'add' | 'merge' | 'split' | null>(null);

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCapacity, setFilterCapacity] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [showReservationDialog, setShowReservationDialog] = useState(false);
    const [tableForReservation, setTableForReservation] = useState<Table | null>(null);

    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'occupied':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'reserved':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'cleaning':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const handleNewOrder = async (tableId: number, isNew: boolean = true) => {
        setSelectedTableId(tableId);
        setIsNewOrder(isNew);
        setShowOrderDialog(true);
        if (!isNew) {
            const tableOrders = orders.filter(order => order.table_id === tableId);
            const activeOrder = tableOrders.find(order =>
                order.status !== 'paid' && order.status !== 'cancelled'
            );
            if (activeOrder) {
                setSelectedOrder(activeOrder);
            }
        }
    };

    const handlePayment = async (table: Table) => {
        const tableOrders = orders.filter(order => order.table_id === table.id);
        const activeOrder = tableOrders.find(order =>
            order.status !== 'paid' && order.status !== 'cancelled'
        );
        if (activeOrder) {
            setSelectedOrder(activeOrder);
            setShowPaymentDialog(true);
        }
    };

    const handleDeleteTable = async (tableId: number) => {
        try {
            const table = tables.find(t => t.id === tableId);
            if (table && table.status === 'available') {
                await deleteTableMutation.mutateAsync(tableId);
                toast.success('Table deleted successfully');
            } else {
                toast.error('Cannot delete an occupied table');
            }
        } catch (err) {
            toast.error(`Failed to delete table`, {
                description: err instanceof Error ? err.message : "An unknown error occurred",
            });
        }
    };

    const handleStatusChange = async (tableId: number, status: Table['status']) => {
        try {
            await updateTableMutation.mutateAsync({ id: tableId, table: { status } });
            toast.success(`Table status updated to ${status}`);
        } catch (err) {
            toast.error(`Failed to update table status to ${status}`, {
                description: err instanceof Error ? err.message : "An unknown error occurred",
            });
        }
    };

    const handleViewOrders = (tableId: number) => {
        setSelectedTableId(tableId);
        setShowOrdersDialog(true);
    };

    const handleOrderPayment = (order: Order) => {
        setSelectedOrder(order);
        setShowOrdersDialog(false);
        setShowPaymentDialog(true);
    };

    if (isLoadingTables || isLoadingOrders) {
        return <TablesSkeleton />;
    }

    if (isErrorTables || isErrorOrders) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                    <p className="text-muted-foreground">{tablesErrorMessage?.message || ordersErrorMessage?.message}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const filteredTables = tables.filter(table => {
        const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
        const matchesCapacity = filterCapacity === 'all' ||
            (filterCapacity === 'small' && table.capacity <= 4) ||
            (filterCapacity === 'medium' && table.capacity > 4 && table.capacity <= 8) ||
            (filterCapacity === 'large' && table.capacity > 8);
        const matchesSearch = searchQuery === '' ||
            table.table_number.toString().includes(searchQuery);
        return matchesStatus && matchesCapacity && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Order Table Wise</h1>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => setTableManagementAction('merge')}>
                        <Merge className="mr-2 h-4 w-4" />
                        Merge Tables
                    </Button>
                    <Button onClick={() => setTableManagementAction('add')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Table
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
                <FilterDropdownContainer>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[130px] sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterCapacity} onValueChange={setFilterCapacity}>
                        <SelectTrigger className="w-[130px] sm:w-[180px]">
                            <SelectValue placeholder="Filter by capacity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Capacities</SelectItem>
                            <SelectItem value="small">Small (1-4)</SelectItem>
                            <SelectItem value="medium">Medium (5-8)</SelectItem>
                            <SelectItem value="large">Large (8+)</SelectItem>
                        </SelectContent>
                    </Select>
                </FilterDropdownContainer>

                <div className="relative w-full md:w-auto flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTables.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        getStatusColor={getStatusColor}
                        onDelete={handleDeleteTable}
                        onNewOrder={handleNewOrder}
                        onViewOrders={handleViewOrders}
                        onPayment={handlePayment}
                        onStatusChange={handleStatusChange}
                        onSplit={() => setTableManagementAction('split')}
                    />
                ))}
            </div>

            {tables.length === 0 && (
                <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                        <p className="text-muted-foreground">No tables found</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setTableManagementAction('add')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Table
                        </Button>
                    </div>
                </div>
            )}

            <CreateOrderDialog
                open={showOrderDialog}
                onClose={() => {
                    setShowOrderDialog(false);
                    setSelectedTableId(null);
                    setSelectedOrder(null);
                }}
                table_id={selectedTableId || 0}
                existingOrder={!isNewOrder ? selectedOrder : undefined}
            />

            {selectedOrder && (
                <>
                    <PaymentDialog
                        key={`payment-dialog-${selectedOrder.id}`}
                        open={showPaymentDialog}
                        onClose={() => {
                            setShowPaymentDialog(false);
                            setSelectedOrder(null);
                        }}
                        order={selectedOrder}
                    />
                </>
            )}

            {selectedTableId && (
                <ViewOrdersDialog
                    open={showOrdersDialog}
                    onClose={() => {
                        setShowOrdersDialog(false);
                        setSelectedTableId(null);
                    }}
                    tableId={selectedTableId}
                    onPayment={handleOrderPayment}
                />
            )}

            {tableManagementAction && (
                <TableManagementDialog
                    open={tableManagementAction !== null}
                    onClose={() => setTableManagementAction(null)}
                    action={tableManagementAction}
                    selectedTable={
                        tableManagementAction === 'split'
                            ? tables.find((t) => t.status === 'available')
                            : undefined
                    }
                />
            )}

            {tableForReservation && (
                <TableReservationDialog
                    open={showReservationDialog}
                    onClose={() => {
                        setShowReservationDialog(false);
                        setTableForReservation(null);
                    }}
                    table={tableForReservation}
                />
            )}
        </div>
    );
}
