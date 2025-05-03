import { User, Phone, Clock, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const staffMembers = [
  {
    id: 1,
    name: 'Alice Smith',
    role: 'Server',
    phone: '(555) 111-2233',
    shift: '10:00 AM - 6:00 PM',
    status: 'active',
    tables: [4, 5, 6],
    performance: {
      ordersServed: 245,
      avgRating: 4.8
    }
  },
  {
    id: 2,
    name: 'Bob Johnson',
    role: 'Chef',
    phone: '(555) 444-5566',
    shift: '4:00 PM - 12:00 AM',
    status: 'active',
    performance: {
      dishesPrepped: 180,
      avgPrepTime: '12 min'
    }
  },
];

export default function Staff() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Staff Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff..."
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {staffMembers.map((staff) => (
          <div
            key={staff.id}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 p-2">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{staff.name}</h3>
                  <p className="text-sm text-muted-foreground">{staff.role}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  staff.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {staff.phone}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {staff.shift}
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">Performance Metrics</h4>
              {staff.role === 'Server' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{staff.performance.ordersServed}</p>
                    <p className="text-sm text-muted-foreground">Orders Served</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{staff.performance.avgRating}</p>
                    <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{staff.performance.dishesPrepped}</p>
                    <p className="text-sm text-muted-foreground">Dishes Prepped</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{staff.performance.avgPrepTime}</p>
                    <p className="text-sm text-muted-foreground">Avg. Prep Time</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}