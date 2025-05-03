import { CreditCard, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const payments = [
  {
    id: 1,
    orderId: 'ORD-001',
    amount: 45.98,
    method: 'Credit Card',
    status: 'completed',
    customer: 'Michael Brown',
    date: '2024-03-10 19:30',
    items: ['Classic Burger x2', 'Caesar Salad x1']
  },
  {
    id: 2,
    orderId: 'ORD-002',
    amount: 27.98,
    method: 'Cash',
    status: 'completed',
    customer: 'Sarah Wilson',
    date: '2024-03-10 20:15',
    items: ['Margherita Pizza x1', 'Classic Burger x1']
  },
];

export default function Payments() {
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
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="px-6 py-4 font-medium">{payment.orderId}</td>
                  <td className="px-6 py-4">{payment.customer}</td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {payment.items.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">${payment.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {payment.method}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{payment.date}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}