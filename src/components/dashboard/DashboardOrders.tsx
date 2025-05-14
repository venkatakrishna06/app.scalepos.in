import {memo, useMemo, useState} from 'react';
import {AlertCircle, Clock, FileText, LayoutGrid, LayoutList, Plus, Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useOrderStore} from '@/lib/store';
import {CreateOrderDialog} from '@/components/create-order-dialog';
import {Order} from '@/types';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {cn} from '@/lib/utils';
import {usePermissions} from '@/hooks/usePermissions';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';

interface DashboardOrdersProps {
  /** Optional initial filter status */
  initialFilterStatus?: string;
}

/**
 * Component for displaying and managing orders in the dashboard
 * 
 * This component is responsible for:
 * - Displaying a list of active orders
 * - Filtering orders by status
 * - Providing a UI for creating new orders
 */
const DashboardOrdersComponent: React.FC<DashboardOrdersProps> = () => {
  // Dialog state
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Store state
  const { getActiveOrders, loading: ordersLoading, error: ordersError } = useOrderStore();
  const { canCreateOrders, canCancelOrders } = usePermissions();

  // Get active orders using the selector with error handling
  const activeOrders = useMemo(() => {
    try {
      return getActiveOrders();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active orders';
      setError(errorMessage);
      return [];
    }
  }, [getActiveOrders, setError]);

  // Filter orders based on status and search query
  const filteredOrders = useMemo(() => {
    return activeOrders.filter(order => {
      // Filter by status
      if (filterStatus !== 'all' && order.status !== filterStatus) {
        return false;
      }

      // Filter by search query (if implemented)
      if (searchQuery) {
        // Example: search by order ID or table number
        return order.id.toString().includes(searchQuery) || 
               (order.table_id && order.table_id.toString().includes(searchQuery));
      }

      return true;
    });
  }, [activeOrders, filterStatus, searchQuery]);

  // Enhanced loading state
  if (ordersLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <div className="text-center">
          <p className="font-medium">Loading Orders</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch the latest orders...
          </p>
        </div>
      </div>
    );
  }

  // Error handling
  if (ordersError || error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <p className="font-medium text-destructive">Error Loading Orders</p>
          <p className="text-sm text-muted-foreground">
            {ordersError || error}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Active Orders</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="served">Served</SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(viewMode === 'grid' ? 'bg-muted' : '')}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(viewMode === 'list' ? 'bg-muted' : '')}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className={cn(
        "grid gap-4",
        viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {filteredOrders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            canCancelOrders={canCancelOrders} 
          />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-semibold">No Orders Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filterStatus !== 'all' 
              ? `No ${filterStatus} orders found. Try a different filter.` 
              : "There are no active orders at the moment."}
          </p>
          {canCreateOrders && (
            <Button variant="outline" className="mt-4" onClick={() => setShowOrderDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Order
            </Button>
          )}
        </div>
      )}

      <CreateOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        table_id={1}
        onCreateOrder={() => setShowOrderDialog(false)}
      />
    </div>
  );
};

// Memoized OrderCard component to prevent unnecessary rerenders
const OrderCard = memo(({ order, canCancelOrders }: { order: Order, canCancelOrders: boolean }) => {
  return (
    <Card
      className="group relative overflow-hidden transition-shadow hover:shadow-lg"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table_id}`}
            </CardTitle>
            <CardDescription>
              Order #{order.id} • {new Date(order.order_time).toLocaleString()}
            </CardDescription>
          </div>
          <Badge className={cn(
            order.status === 'placed' && "bg-blue-100 text-blue-800",
            order.status === 'preparing' && "bg-yellow-100 text-yellow-800",
            order.status === 'served' && "bg-green-100 text-green-800"
          )}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-2">
          {order?.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 min-w-5 flex items-center justify-center p-0">
                  {item.quantity}
                </Badge>
                <span className={cn(
                  item.status === 'cancelled' && "line-through text-muted-foreground"
                )}>
                  {item.name}
                </span>
              </div>
              <span className="font-medium">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {new Date(order.order_time).toLocaleTimeString()}
          </span>
        </div>
        <span className="text-lg font-semibold">
          ₹{order.total_amount?.toFixed(2)}
        </span>
      </CardFooter>

      <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-end gap-2 border-t bg-background/95 p-4 backdrop-blur transition-transform group-hover:translate-y-0">
        <Button variant="outline" size="sm">View Details</Button>
        {canCancelOrders && (
          <Button size="sm">Update Status</Button>
        )}
      </div>
    </Card>
  );
});

OrderCard.displayName = 'OrderCard';

// Export the memoized component
export const DashboardOrders = memo(DashboardOrdersComponent);
