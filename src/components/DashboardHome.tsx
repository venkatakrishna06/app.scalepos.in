import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Clock,
  Coffee,
  IndianRupee,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Table2,
  Tags,
  TrendingUp,
  Users
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useMenuStore, useOrderStore} from '@/lib/store';
import {toast} from '@/lib/toast';
import {cn} from '@/lib/utils';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';

export function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { orders, fetchOrders } = useOrderStore();
  const { menuItems, fetchMenuItems } = useMenuStore();

  // Function to fetch data directly from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchOrders({period:"day"}),
        fetchMenuItems()
      ]);
      setLoading(false);
    } catch {
      // Handle error without using the error object
      toast.error('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Function to handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Filter active orders
  const activeOrders = orders.filter(order => 
    order.status !== 'paid' && order.status !== 'cancelled'
  );

  // Calculate metrics
  const todaySales = orders
    .filter(order => {
      const orderDate = new Date(order.order_time);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString() && order.status === 'paid';
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const tablesInUse = activeOrders
    .filter(order => order.order_type === 'dine-in')
    .reduce((tables, order) => {
      if (order.table_id && !tables.includes(order.table_id)) {
        tables.push(order.table_id);
      }
      return tables;
    }, [] as number[]).length;

  const popularItems = menuItems
    .map(item => {
      const orderCount = orders.reduce((count, order) => {
        const orderItems = order.items || [];
        const matchingItems = orderItems.filter(orderItem => orderItem.menu_item_id === item.id);
        return count + matchingItems.reduce((sum, orderItem) => sum + orderItem.quantity, 0);
      }, 0);
      return { ...item, orderCount };
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  // Get order status counts
  const placedCount = activeOrders.filter(o => o.status === 'placed').length;
  const preparingCount = activeOrders.filter(o => o.status === 'preparing').length;
  const servedCount = activeOrders.filter(o => o.status === 'served').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={loading}
          className="h-9 px-4"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value={`₹${todaySales.toFixed(2)}`}
          icon={<IndianRupee className="h-5 w-5" />}
          description="Total revenue today"
          loading={loading}
          trend="up"
          onClick={() => navigate('/payments')}
        />

        <StatsCard
          title="Active Orders"
          value={activeOrders.length.toString()}
          icon={<ClipboardList className="h-5 w-5" />}
          description={`${placedCount} placed, ${preparingCount} preparing, ${servedCount} served`}
          loading={loading}
          onClick={() => navigate('/orders')}
        />

        <StatsCard
          title="Tables In Use"
          value={tablesInUse.toString()}
          icon={<Table2 className="h-5 w-5" />}
          description={`${Math.round(tablesInUse / 20 * 100)}% occupancy rate`}
          loading={loading}
          onClick={() => navigate('/tables')}
        />

        <StatsCard
          title="Menu Items"
          value={menuItems.length.toString()}
          icon={<Coffee className="h-5 w-5" />}
          description={`${menuItems.filter(i => i.available).length} available`}
          loading={loading}
          onClick={() => navigate('/menu')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <CardDescription>
                Your most recent active orders
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => navigate('/orders')}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="sr-only">View all orders</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between border-b pb-4 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                    onClick={() => navigate(`/orders?id=${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        order.status === 'placed' ? "bg-blue-100" :
                        order.status === 'preparing' ? "bg-yellow-100" :
                        "bg-green-100"
                      )}>
                        {order.order_type === 'dine-in' ? (
                          <Table2 className={cn(
                            "h-5 w-5",
                            order.status === 'placed' ? "text-blue-700" :
                            order.status === 'preparing' ? "text-yellow-700" :
                            "text-green-700"
                          )} />
                        ) : (
                          <ShoppingBag className={cn(
                            "h-5 w-5",
                            order.status === 'placed' ? "text-blue-700" :
                            order.status === 'preparing' ? "text-yellow-700" :
                            "text-green-700"
                          )} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {order.order_type === 'dine-in' ? `Table ${order.table_id}` : 'Takeaway'} - #{order.id}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(order.order_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "capitalize",
                        order.status === 'placed' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                        order.status === 'preparing' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                        order.status === 'served' ? "bg-green-100 text-green-800 hover:bg-green-200" :
                        "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      )}>
                        {order.status}
                      </Badge>
                      <span className="font-medium text-sm">₹{order.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No active orders</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All orders have been completed or cancelled
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/orders')}>
              View All Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Popular Items */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Popular Items</CardTitle>
              <CardDescription>
                Your most ordered menu items
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => navigate('/menu')}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="sr-only">View all menu items</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : popularItems.length > 0 ? (
              <div className="space-y-4">
                {popularItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between border-b pb-4 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                    onClick={() => navigate(`/menu?id=${item.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-md object-cover border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>{item.orderCount}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Coffee className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No popular items</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start taking orders to see popular items
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/menu')}>
              Manage Menu Items
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <ActionButton
              icon={<Table2 className="h-6 w-6" />}
              label="Tables"
              onClick={() => navigate('/tables')}
            />
            <ActionButton
              icon={<ShoppingBag className="h-6 w-6" />}
              label="Takeaway"
              onClick={() => navigate('/takeaway')}
            />
            <ActionButton
              icon={<Coffee className="h-6 w-6" />}
              label="Menu"
              onClick={() => navigate('/menu')}
            />
            <ActionButton
              icon={<Tags className="h-6 w-6" />}
              label="Categories"
              onClick={() => navigate('/categories')}
            />
            <ActionButton
              icon={<Users className="h-6 w-6" />}
              label="Staff"
              onClick={() => navigate('/staff')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

function StatsCard({ title, value, icon, description, loading = false, trend, onClick }: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn(
          "rounded-full p-1",
          trend === 'up' ? "bg-green-100" : 
          trend === 'down' ? "bg-red-100" : 
          "bg-muted"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <Button 
      variant="outline" 
      className="flex h-24 flex-col items-center justify-center gap-2 p-0 hover:border-primary/50 hover:bg-muted/80" 
      onClick={onClick}
    >
      <div className="rounded-full bg-primary/10 p-2">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
