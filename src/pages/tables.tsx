import { useState, useEffect } from 'react';
import { Table2, Users, Coffee, Clock, Plus, Trash2, Split, Merge, CreditCard, ClipboardList, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateOrderDialog } from '@/components/create-order-dialog';
import { PaymentDialog } from '@/components/payment-dialog';
import { TableManagementDialog } from '@/components/table-management-dialog';
import { ViewOrdersDialog } from '@/components/view-orders-dialog';
import { useTableStore, useOrderStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { Table, Order } from '@/types';

export default function Tables() {
  const { tables, loading, error, fetchTables, deleteTable, updateTableStatus } = useTableStore();
  const { orders, loading: ordersLoading, error: ordersError, getOrdersByTable, fetchOrders } = useOrderStore();
  const { handleError } = useErrorHandler();
  
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [tableManagementAction, setTableManagementAction] = useState<'add' | 'merge' | 'split' | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTables(), fetchOrders()]);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [fetchTables, fetchOrders, handleError]);

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'occupied':
        return 'text-orange-600';
      case 'reserved':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
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

  const handleCreateOrder = async (items: any[]) => {
    if (!selectedTableId) return;
    try {
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
      setShowStatusMenu(null);
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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading tables...</span>
        </div>
      </div>
    );
  }

  if (error || ordersError) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">
            {error || ordersError}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              fetchTables();
              fetchOrders();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Table Management</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setTableManagementAction('merge')}>
            <Merge className="mr-2 h-4 w-4" />
            Merge Tables
          </Button>
          <Button onClick={() => setTableManagementAction('add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className="relative rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">Table {table.table_number}</p>
                  <span className={`text-sm font-medium ${getStatusColor(table.status)}`}>
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {table.capacity}</span>
                </div>
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStatusMenu(showStatusMenu === table.id ? null : table.id)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
                {showStatusMenu === table.id && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg">
                    <button
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleStatusChange(table.id, 'available')}
                    >
                      Set Available
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleStatusChange(table.id, 'reserved')}
                    >
                      Set Reserved
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleStatusChange(table.id, 'available')}
                    >
                      Set Cleaning
                    </button>
                  </div>
                )}
              </div>
            </div>

            {table.merged_with && (
              <div className="mt-2 text-sm text-muted-foreground">
                Merged with: Table {table.merged_with.map(id =>
                  tables.find(t => t.id === id)?.table_number
                ).join(', ')}
              </div>
            )}

            {table.current_order_id && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <span>Order #{table.current_order_id}</span>
                  <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  <span>Active</span>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {table.status === 'available' && (
                <>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleNewOrder(table.id)}
                  >
                    New Order
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTableManagementAction('split')}
                  >
                    <Split className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTable(table.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {table.status === 'occupied' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleNewOrder(table.id, false)}
                  >
                    Add Items
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewOrders(table.id)}
                  >
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handlePayment(table)}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {tables.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No Tables found
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