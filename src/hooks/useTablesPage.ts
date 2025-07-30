import {useMemo, useState} from 'react';
import {useDeleteTable, useTables, useUpdateTable} from '@/api/tables';
import {useOrders} from '@/api/orders';
import {Order, Table} from '@/types';
import {toast} from '@/lib/toast';

export const useTablesPage = () => {
    const {
        data: tables = [],
        isLoading: isLoadingTables,
        isError: isErrorTables,
        error: tablesErrorMessage
    } = useTables();
    const deleteTableMutation = useDeleteTable();
    const updateTableMutation = useUpdateTable();
    const {
        data: orders = [],
        isLoading: isLoadingOrders,
        isError: isErrorOrders,
        error: ordersErrorMessage
    } = useOrders();

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

    const filteredTables = useMemo(() => {
        return tables.filter(table => {
            const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
            const matchesCapacity = filterCapacity === 'all' ||
                (filterCapacity === 'small' && table.capacity <= 4) ||
                (filterCapacity === 'medium' && table.capacity > 4 && table.capacity <= 8) ||
                (filterCapacity === 'large' && table.capacity > 8);
            const matchesSearch = searchQuery === '' ||
                table.table_number.toString().includes(searchQuery);
            return matchesStatus && matchesCapacity && matchesSearch;
        });
    }, [tables, filterStatus, filterCapacity, searchQuery]);

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
            await updateTableMutation.mutateAsync({id: tableId, table: {status}});
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

    return {
        tables,
        isLoadingTables,
        isErrorTables,
        tablesErrorMessage,
        isLoadingOrders,
        isErrorOrders,
        ordersErrorMessage,
        selectedTableId,
        selectedOrder,
        isNewOrder,
        showOrderDialog,
        setShowOrderDialog,
        showPaymentDialog,
        setShowPaymentDialog,
        showOrdersDialog,
        setShowOrdersDialog,
        tableManagementAction,
        setTableManagementAction,
        filterStatus,
        setFilterStatus,
        filterCapacity,
        setFilterCapacity,
        searchQuery,
        setSearchQuery,
        showReservationDialog,
        setShowReservationDialog,
        tableForReservation,
        setTableForReservation,
        filteredTables,
        getStatusColor,
        handleNewOrder,
        handlePayment,
        handleDeleteTable,
        handleStatusChange,
        handleViewOrders,
        handleOrderPayment,
    };
};
