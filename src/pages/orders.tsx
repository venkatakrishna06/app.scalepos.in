import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderStore, useTableStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { format } from 'date-fns';
import { Order } from '@/types';

export default function Orders() {
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    fetchOrders,
    updateOrderStatus
  } = useOrderStore();
  
  const {
    tables,
    loading: tablesLoading,
    error: tablesError,
    fetchTables
  } = useTableStore();
  
  const { handleError } = useErrorHandler();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchOrders(), fetchTables()]);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [fetchOrders, fetchTables, handleError]);

  const handleStatusChange = async (orderId: number, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      handleError(err);
    }
  };

  const getTableNumber = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.table_number : tableId;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;
    const matchesSearch = 
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.server.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `Table ${getTableNumber(order.table_id)}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (ordersLoading || tablesLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  if (ordersError || tablesError) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">
            {ordersError || tablesError}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              fetchOrders();
              fetchTables();
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
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="placed">Placed</option>
            <option value="preparing">Preparing</option>
            <option value="served">Served</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {order.order_type === 'takeaway' ? 'Takeaway' : `Table ${getTableNumber(order.table_id)}`}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    #{order.id}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'served' ? 'bg-green-100 text-green-800' :
                    order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(order.order_time), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {order.status === 'placed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'served')}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Served
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1">{item.name}</td>
                      <td className="py-1">{item.quantity}</td>
                      <td className="py-1">₹{item.price.toFixed(2)}</td>
                      <td className="py-1">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
              <div>
                <p>Customer: {order.customer}</p>
                <p className="text-muted-foreground">Server: {order.server}</p>
                {/*{order.paymentMethod && (*/}
                {/*  <p className="text-muted-foreground">*/}
                {/*    Payment: {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}*/}
                {/*  </p>*/}
                {/*)}*/}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">
                  ₹ {order.total_amount?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}