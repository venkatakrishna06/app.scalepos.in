import { CreditCard, Calendar, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePaymentStore, useOrderStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';


export default function Payments() {
  const {
    payments,
    loading,
    error,
    fetchPayments,
    updatePaymentStatus
  } = usePaymentStore();

  const { orders } = useOrderStore();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const getOrderDetails = (orderId: number) => {
    return orders.find(order => order.id === orderId);
  };

  const filteredPayments = payments.filter(payment => {
    const order = getOrderDetails(payment.order_id);
    return (
        order?.id.toString().includes(searchQuery) ||
        payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.customer?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading payments...</span>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fetchPayments()}
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
          <h1 className="text-2xl font-semibold">Payment History</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Filter by Date
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Items</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
              </thead>
              <tbody>
              {filteredPayments.map((payment) => {
                const order = getOrderDetails(payment.order_id);
                return (
                    <tr key={payment.id} className="border-b">
                      <td className="px-6 py-4 font-medium">Order #{payment.order_id}</td>
                      <td className="px-6 py-4">{order?.customer || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {order?.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">₹{payment.amount_paid.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(payment.paid_at), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'Completed'}
                      </span>
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}