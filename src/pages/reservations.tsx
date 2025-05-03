import { Calendar, Clock, User, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const reservations = [
  {
    id: 1,
    customerName: 'Michael Brown',
    phone: '(555) 123-4567',
    date: '2024-03-15',
    time: '19:00',
    guests: 4,
    table: 6,
    status: 'confirmed'
  },
  {
    id: 2,
    customerName: 'Sarah Wilson',
    phone: '(555) 987-6543',
    date: '2024-03-15',
    time: '20:00',
    guests: 2,
    table: 3,
    status: 'pending'
  },
];

export default function Reservations() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reservations</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Reservation
        </Button>
      </div>

      <div className="space-y-4">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
                      {reservation.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {reservation.time}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Table {reservation.table}</p>
                  <p className="text-sm text-muted-foreground">{reservation.guests} guests</p>
                </div>
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      reservation.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}