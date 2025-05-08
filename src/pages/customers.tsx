import { User, Phone, Mail, Plus, Search, Filter, SortAsc, SortDesc, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'Emma Thompson',
    phone: '(555) 234-5678',
    email: 'emma.t@example.com',
    visits: 12,
    lastVisit: '2024-03-15T18:30:00',
    totalSpent: 458.50,
    notes: 'Prefers window seating',
    status: 'active' as const
  },
  {
    id: 2,
    name: 'David Chen',
    phone: '(555) 876-5432',
    email: 'david.c@example.com',
    visits: 8,
    lastVisit: '2024-03-14T19:45:00',
    totalSpent: 295.75,
    notes: 'Allergic to nuts',
    status: 'active' as const
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    phone: '(555) 345-6789',
    email: 'sarah.w@example.com',
    visits: 15,
    lastVisit: '2024-03-13T20:15:00',
    totalSpent: 725.25,
    notes: 'VIP customer, birthday on April 15',
    status: 'active' as const
  }
];

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type SortField = 'name' | 'visits' | 'lastVisit' | 'totalSpent';

export default function Customers() {
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastVisit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<typeof MOCK_CUSTOMERS[0] | null>(null);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      notes: '',
    },
  });

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(editingCustomer ? 'Customer updated successfully' : 'Customer added successfully');
      setShowDialog(false);
      form.reset();
      setEditingCustomer(null);
    } catch (error) {
      toast.error('Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = MOCK_CUSTOMERS
    .filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'visits':
          return multiplier * (a.visits - b.visits);
        case 'lastVisit':
          return multiplier * (new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime());
        case 'totalSpent':
          return multiplier * (a.totalSpent - b.totalSpent);
        default:
          return 0;
      }
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('name')}
          className="gap-2"
        >
          Name
          {sortField === 'name' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('visits')}
          className="gap-2"
        >
          Visits
          {sortField === 'visits' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('lastVisit')}
          className="gap-2"
        >
          Last Visit
          {sortField === 'lastVisit' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('totalSpent')}
          className="gap-2"
        >
          Total Spent
          {sortField === 'totalSpent' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="group rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 p-2">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {customer.visits} visits
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  ₹{customer.totalSpent.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Spent
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Last visit: {format(new Date(customer.lastVisit), 'MMM d, yyyy')}
              </div>
            </div>

            {customer.notes && (
              <div className="mt-4 rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCustomer(customer);
                  form.reset({
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    notes: customer.notes,
                  });
                  setShowDialog(true);
                }}
              >
                Edit
              </Button>
              <Button size="sm">View Orders</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog}>
        <DialogContent  onClose={!isSubmitting ? () => {
          setShowDialog(false);
          setEditingCustomer(null);
          form.reset();
        } : undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update customer information below.'
                : 'Fill in the details to add a new customer.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Add any notes about the customer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingCustomer(null);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingCustomer ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCustomer ? 'Update Customer' : 'Add Customer'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {filteredCustomers.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No customers found
        </div>
      )}
    </div>
  );
}