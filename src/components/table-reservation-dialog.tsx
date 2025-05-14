import {useState} from 'react';
import {Calendar, Clock, Loader2, Users} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from './ui/dialog';
import {Button} from './ui/button';
import {Input} from './ui/input';
// import { Label } from './ui/label';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form';
import {Table} from '@/types';
import {toast} from '@/lib/toast';
import {useTableStore} from '@/lib/store';

interface TableReservationDialogProps {
  open: boolean;
  onClose: () => void;
  table: Table;
}

const reservationSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date',
  }),
  time: z.string().refine(val => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
    message: 'Please enter a valid time in 24-hour format (HH:MM)',
  }),
  guests: z.number().min(1, 'Must have at least 1 guest').max(20, 'Maximum 20 guests allowed'),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export function TableReservationDialog({ open, onClose, table }: TableReservationDialogProps) {
  const { updateTableStatus } = useTableStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      guests: table.capacity,
    },
  });

  const handleReservation = async (data: ReservationFormData) => {
    try {
      setIsSubmitting(true);

      // In a real app, you would send this data to your backend
      // For now, we'll just update the table status to 'reserved'
      await updateTableStatus(table.id, 'reserved');

      toast.success('Table reserved successfully', {
        description: `Reserved for ${data.customerName} on ${data.date} at ${data.time}`,
      });

      onClose();
    } catch {
      toast.error('Failed to reserve table');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onClose={!isSubmitting ? onClose : undefined}>
        <DialogHeader>
          <DialogTitle>Reserve Table {table.table_number}</DialogTitle>
          <DialogDescription>
            Fill in the details to reserve this table.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleReservation)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} type="date" className="pl-9" />
                      </div>
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
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} type="time" className="pl-9" />
                      </div>
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
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="number" 
                        min={1} 
                        max={table.capacity} 
                        className="pl-9"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Reserve Table'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
