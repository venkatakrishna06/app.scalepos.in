import { useState, useEffect, useRef } from 'react';
import { Users, Coffee, Clock, Plus, Trash2, Split, Merge, CreditCard, ClipboardList, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateOrderDialog } from '@/components/create-order-dialog';
import { PaymentDialog } from '@/components/payment-dialog';
import { TableManagementDialog } from '@/components/table-management-dialog';
import { ViewOrdersDialog } from '@/components/view-orders-dialog';
import {useTableStore, useOrderStore, useMenuStore} from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { Table, Order } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Tables() {
  const { tables, loading, error, fetchTables, deleteTable, updateTableStatus } = useTableStore();
  const { loading: ordersLoading, error: ordersError, getOrdersByTable, fetchOrders } = useOrderStore();
  const {fetchMenuItems} = useMenuStore();
  const { handleError } = useErrorHandler();

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [tableManagementAction, setTableManagementAction] = useState<'add' | 'merge' | 'split' | null>(null);

  // Using a ref to prevent duplicate API calls in StrictMode
  const isDataFetchedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTables(), fetchOrders(), fetchMenuItems()]);
      } catch (err) {
        handleError(err);
      }
    };

    if (!isDataFetchedRef.current) {
      loadData();
      isDataFetchedRef.current = true;
    }
  }, [fetchTables, fetchOrders, fetchMenuItems, handleError]);

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
  const handleCreateOrder = async (items: OrderItem[]) => {
    if (!selectedTableId) return;
    try {
      // Update table status after order is created
      await updateTableStatus(selectedTableId, 'occupied');
      setSelectedTableId(null);
      setSelectedOrder(null);
      setShowOrderDialog(false);
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
      handleError(err);
    }
  };

  const handleStatusChange = async (tableId: number, status: Table['status']) => {
    try {
      await updateTableStatus(tableId, status);
    } catch (err) {
      handleError(err);
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

  if (loading || ordersLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading tables...</span>
        </div>
      </div>
    );
  }

  if (error || ordersError) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive">
            {error || ordersError}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              fetchTables();
              fetchOrders();
              fetchMenuItems()
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Table {table.table_number}</h2>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      getStatusColor(table.status)
                    )}>
                      {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {table.capacity}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange(table.id, 'available')}>
                      Mark Available
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(table.id, 'reserved')}>
                      Mark Reserved
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {table.merged_with && (
                <div className="mt-4 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                  Merged with: Table {table.merged_with.map(id =>
                    tables.find(t => t.id === id)?.table_number
                  ).join(', ')}
                </div>
              )}

              {table.current_order_id && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coffee className="h-4 w-4" />
                    <span>Active Order #{table.current_order_id}</span>
                    <Clock className="ml-2 h-4 w-4" />
                    <span>In Progress</span>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-end gap-2 border-t bg-background/95 p-4 backdrop-blur transition-transform group-hover:translate-y-0">
              {table.status === 'available' && (
                <>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTable(table.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTableManagementAction('split')}
                  >
                    <Split className="mr-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleNewOrder(table.id)}
                  >
                    New Order
                  </Button>
                </>
              )}
              {table.status === 'occupied' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNewOrder(table.id, false)}
                  >
                    Add Items
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrders(table.id)}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Orders
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePayment(table)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay
                  </Button>
                </>
              )}
            </div>
          </div>
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
    </div>
  );
}
