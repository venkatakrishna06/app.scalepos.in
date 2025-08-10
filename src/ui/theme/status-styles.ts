// Centralized status styles using semantic tokens
// These classNames rely on Tailwind colors wired to CSS variables in index.css

export type GenericStatus = string;

export function statusBadge(status: GenericStatus) {
  switch (status) {
    case 'placed':
    case 'info':
      return 'badge badge-info';
    case 'preparing':
    case 'warning':
    case 'ready':
      return 'badge badge-warning';
    case 'served':
    case 'success':
    case 'available':
      return 'badge badge-success';
    case 'paid':
    case 'primary':
      return 'badge badge-primary';
    case 'cancelled':
    case 'danger':
      return 'badge badge-danger';
    case 'reserved':
      return 'badge badge-info';
    case 'occupied':
    case 'cleaning':
      return 'badge badge-warning';
    default:
      return 'badge';
  }
}

// Optionally expose simple color tokens for icons/borders if needed
export function statusTextColor(status: GenericStatus) {
  switch (status) {
    case 'placed':
    case 'info':
    case 'reserved':
      return 'text-info';
    case 'preparing':
    case 'warning':
    case 'ready':
    case 'occupied':
    case 'cleaning':
      return 'text-warning';
    case 'served':
    case 'success':
    case 'available':
      return 'text-success';
    case 'paid':
    case 'primary':
      return 'text-primary';
    case 'cancelled':
    case 'danger':
      return 'text-destructive';
    default:
      return 'text-foreground';
  }
}
