import { User, Phone, Mail, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const customers = [
  {
    id: 1,
    name: 'Emma Thompson',
    phone: '(555) 234-5678',
    email: 'emma.t@example.com',
    visits: 12,
    lastVisit: '2024-03-08',
    totalSpent: 458.50
  },
  {
    id: 2,
    name: 'David Chen',
    phone: '(555) 876-5432',
    email: 'david.c@example.com',
    visits: 8,
    lastVisit: '2024-03-05',
    totalSpent: 295.75
  },
];

export default function Customers() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Visits</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Last Visit</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 p-2">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{customer.visits}</td>
                  <td className="px-6 py-4">{customer.lastVisit}</td>
                  <td className="px-6 py-4">${customer.totalSpent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}