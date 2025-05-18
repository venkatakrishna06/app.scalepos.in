import {useEffect, useRef, useState} from 'react';
import {Merge, Plus, Search} from 'lucide-react';
import {TablesSkeleton} from '@/components/skeletons/tables-skeleton';
import {Button} from '@/components/ui/button';
import {CreateOrderDialog} from '@/components/create-order-dialog';
import {PaymentDialog} from '@/components/payment-dialog';
import {TableManagementDialog} from '@/components/table-management-dialog';
import {ViewOrdersDialog} from '@/components/view-orders-dialog';
import {TableReservationDialog} from '@/components/table-reservation-dialog';
import {useMenuStore, useOrderStore, useTableStore} from '@/lib/store';
import {useErrorHandler} from '@/lib/hooks/useErrorHandler';
import {Order, Table} from '@/types';
import {toast} from '@/lib/toast';
import {TableCard} from '@/components/tableCard';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {FilterDropdownContainer} from '@/components/FilterDropdownContainer';

export default function Tables() {
  const { tables, loading, error, fetchTables, deleteTable, updateTableStatus } = useTableStore();
  const { error: ordersError, getOrdersByTable, fetchOrders } = useOrderStore();
  const { fetchMenuItems, fetchCategories } = useMenuStore();
  const { handleError } = useErrorHandler();

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [tableManagementAction, setTableManagementAction] = useState<'add' | 'merge' | 'split' | null>(null);

  // Enhanced filtering and search
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCapacity, setFilterCapacity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table reservation
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [tableForReservation, setTableForReservation] = useState<Table | null>(null);

  // Using a ref to prevent duplicate API calls in StrictMode
  const isDataFetchedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTables(), fetchOrders(), fetchMenuItems(), fetchCategories()]);
      } catch (err) {
        toast.error("Failed to load data", {
          description: err instanceof Error ? err.message : "An unknown error occurred",
        });
      }
    };

    if (!isDataFetchedRef.current) {
      loadData();
      isDataFetchedRef.current = true;
    }
  }, [fetchTables, fetchOrders, fetchMenuItems, handleError, fetchCategories]);

  // Show errors as toast notifications if they exist
  useEffect(() => {
    if (error) {
      toast.error("Table Error", { description: error });
    }
    if (ordersError) {
      toast.error("Order Error", { description: ordersError });
    }
  }, [error, ordersError]);

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

  const handleNewOrder = (tableId: number, isNew: boolean = true) => {
    setSelectedTableId(tableId);
    setIsNewOrder(isNew);
    setShowOrderDialog(true);
    if (!isNew) {
      const tableOrders = getOrdersByTable(tableId);
      const activeOrder = tableOrders.find(order =>
          order.status !== 'paid' && order.status !== 'cancelled'
      );
      if (activeOrder) {
        setSelectedOrder(activeOrder);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateOrder = async (_items: OrderItem[]) => {
    if (!selectedTableId) return;
    try {
      // No need to update table status here as it will be updated via WebSocket
      // The WebSocket service will receive the table update and update the store

      // Only update the state, don't close the dialog here
      // The dialog is already being closed by its internal onClose call
      setSelectedTableId(null);
      setSelectedOrder(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handlePayment = (table: Table) => {
    const tableOrders = getOrdersByTable(table.id);
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
        await deleteTable(tableId);
      }
    } catch (err) {
      toast.error("Failed to delete table", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  };

  const handleStatusChange = async (tableId: number, status: Table['status']) => {
    try {
      await updateTableStatus(tableId, status);
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

  // Only show skeleton when initially loading tables, not when placing an order
  // This allows WebSocket updates to handle table updates after order placement
  if (loading && tables.length === 0) {
    return <TablesSkeleton />;
  }

  // Filter tables based on search and filter criteria
  const filteredTables = tables.filter(table => {
    // Filter by status
    const matchesStatus = filterStatus === 'all' || table.status === filterStatus;

    // Filter by capacity
    const matchesCapacity = filterCapacity === 'all' || 
      (filterCapacity === 'small' && table.capacity <= 4) ||
      (filterCapacity === 'medium' && table.capacity > 4 && table.capacity <= 8) ||
      (filterCapacity === 'large' && table.capacity > 8);

    // Filter by search query (table number)
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

        {/* Enhanced filtering and search */}
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
            onCreateOrder={handleCreateOrder}
            existingOrder={!isNewOrder ? selectedOrder : undefined}
        />

        {selectedOrder && (
            <PaymentDialog
                open={showPaymentDialog}
                onClose={() => {
                  setShowPaymentDialog(false);
                  setSelectedOrder(null);
                }}
                order={selectedOrder}
            />
        )}

        {selectedTableId && (
            <ViewOrdersDialog
                open={showOrdersDialog}
                onClose={() => {
                  setShowOrdersDialog(false);
                  setSelectedTableId(null);
                }}
                orders={getOrdersByTable(selectedTableId)}
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
