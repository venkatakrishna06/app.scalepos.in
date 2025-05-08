import { Calendar, Clock, User, Phone, Plus, Search, Filter, SortAsc, SortDesc, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

const reservationSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  date: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && isAfter(date, addDays(new Date(), -1));
  }, 'Please select a valid future date'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  guests: z.number().min(1, 'At least 1 guest required').max(20, 'Maximum 20 guests allowed'),
  notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

const MOCK_RESERVATIONS = [
  { id: 1, customerName: 'Michael Brown', phone: '(555) 123-4567', email: 'michael@example.com',
    date: '2024-03-20', time: '19:00', guests: 4, table: 6, status: 'confirmed', notes: 'Birthday celebration' },
  { id: 2, customerName: 'Sarah Wilson', phone: '(555) 987-6543', email: 'sarah@example.com',
    date: '2024-03-20', time: '20:00', guests: 2, table: 3, status: 'pending', notes: 'Window seat preferred' },
  { id: 3, customerName: 'James Lee', phone: '(555) 456-7890', email: 'james@example.com',
    date: '2024-03-21', time: '18:30', guests: 6, table: 8, status: 'confirmed', notes: 'Allergic to nuts' },
];

export default function Reservations() {
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'guests'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      guests: 2,
      notes: '',
    },
  });

  const handleSubmit = async (data: ReservationFormData) => {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Reservation created successfully');
      setShowDialog(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReservations = MOCK_RESERVATIONS
    .filter(reservation => {
      const matchesSearch = 
        reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.phone.includes(searchQuery) ||
        reservation.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = dateFilter === 'all' || reservation.date === dateFilter;
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else {
        return sortOrder === 'asc' ? a.guests - b.guests : b.guests - a.guests;
      }
    });

  const upcomingReservations = filteredReservations.filter(reservation => 
    isAfter(parseISO(`${reservation.date}T${reservation.time}`), new Date())
  );

  const pastReservations = filteredReservations.filter(reservation => 
    isBefore(parseISO(`${reservation.date}T${reservation.time}`), new Date())
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reservations</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="2024-03-20">Today</SelectItem>
              <SelectItem value="2024-03-21">Tomorrow</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Reservation
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSortField('date');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
          className="gap-2"
        >
          Date & Time
          {sortField === 'date' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSortField('guests');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
          className="gap-2"
        >
          Party Size
          {sortField === 'guests' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>

      {upcomingReservations.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Upcoming Reservations</h2>
          <div className="space-y-4">
            {upcomingReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="group rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{reservation.customerName}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {reservation.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(`${reservation.date}T${reservation.time}`), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          reservation.status === 'confirmed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Table {reservation.table}</p>
                      <p>{reservation.guests} guests</p>
                    </div>
                  </div>
                </div>
                {reservation.notes && (
                  <div className="mt-4 rounded-md bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">{reservation.notes}</p>
                  </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Cancel</Button>
                  {reservation.status === 'pending' && (
                    <Button size="sm">Confirm</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pastReservations.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Past Reservations</h2>
          <div className="space-y-4">
            {pastReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-lg border bg-muted/10 p-6"
              >
                <div className="flex items-center justify-between opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{reservation.customerName}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(`${reservation.date}T${reservation.time}`), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Table {reservation.table}</p>
                    <p>{reservation.guests} guests</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showDialog} >
        <DialogContent onClose={!isSubmitting ? () => setShowDialog(false) : undefined}>
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new reservation.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
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

              {/*<FormField*/}
              {/*  control={form.control}*/}
              {/*  name="email"*/}
              {/*  render={({ field }) => (*/}
              {/*    <FormItem>*/}
              {/*      <FormLabel>Email (Optional)</FormLabel>*/}
              {/*      <FormControl>*/}
              {/*        <Input type="email" placeholder="Enter email address" {...field} />*/}
              {/*      </FormControl>*/}
              {/*      <FormMessage />*/}
              {/*    </FormItem>*/}
              {/*  )}*/}
              {/*/>*/}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*<FormField*/}
              {/*  control={form.control}*/}
              {/*  name="notes"*/}
              {/*  render={({ field }) => (*/}
              {/*    <FormItem>*/}
              {/*      <FormLabel>Special Requests (Optional)</FormLabel>*/}
              {/*      <FormControl>*/}
              {/*        <textarea*/}
              {/*          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"*/}
              {/*          placeholder="Enter any special requests or notes"*/}
              {/*          {...field}*/}
              {/*        />*/}
              {/*      </FormControl>*/}
              {/*      <FormMessage />*/}
              {/*    </FormItem>*/}
              {/*  )}*/}
              {/*/>*/}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Reservation'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {upcomingReservations.length === 0 && pastReservations.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No reservations found
        </div>
      )}

      {upcomingReservations.length === 0 && pastReservations.length > 0 && (
        <div className="mb-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No upcoming reservations
        </div>
      )}

      {upcomingReservations.length > 0 && pastReservations.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No past reservations
        </div>
      )}
    </div>
  );
}