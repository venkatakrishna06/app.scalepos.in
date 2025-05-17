
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, ClipboardList, Clock, DollarSign, Loader2, RefreshCw, ShoppingBag, Table2, TrendingUp, Users} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useMenuStore, useOrderStore} from '@/lib/store';
import {toast} from '@/lib/toast';

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';

export function DashboardHome() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { orders, fetchOrders } = useOrderStore();
  const { menuItems, fetchMenuItems } = useMenuStore();

  // Function to fetch data directly from API
  const fetchDashboardData = async (skipCache = true) => {
    try {
      setLoading(true);

      // Fetch data directly from API and update the stores
      // Pass skipCache=true to bypass cache and fetch fresh data
      await Promise.all([
        fetchOrders({period:"day"}, skipCache),
        fetchMenuItems(skipCache)
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
      return orderDate.toDateString() === today.toDateString();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeOrders.filter(o => o.status === 'placed').length} placed, {activeOrders.filter(o => o.status === 'preparing').length} preparing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables In Use</CardTitle>
            <Table2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tablesInUse}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(tablesInUse / 20 * 100)}% occupancy rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Your most recent orders across all types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  {order.order_type === 'dine-in' ? (
                    <Table2 className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {order.order_type === 'dine-in' ? `Table ${order.table_id}` : 'Takeaway'} - Order #{order.id}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(order.order_time).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    order.status === 'placed' ? "bg-blue-100 text-blue-800" :
                    order.status === 'preparing' ? "bg-yellow-100 text-yellow-800" :
                    order.status === 'served' ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <span className="font-medium">₹{order.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => navigate('/orders')}>
            View All Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Button variant="outline" className="flex h-24 flex-col items-center justify-center gap-1" onClick={() => navigate('/tables')}>
              <Table2 className="h-8 w-8" />
              <span>Manage Tables</span>
            </Button>

            <Button variant="outline" className="flex h-24 flex-col items-center justify-center gap-1" onClick={() => navigate('/menu')}>
              <ClipboardList className="h-8 w-8" />
              <span>Menu Items</span>
            </Button>
            <Button variant="outline" className="flex h-24 flex-col items-center justify-center gap-1" onClick={() => navigate('/customers')}>
              <Users className="h-8 w-8" />
              <span>Customers</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popular Items */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Items</CardTitle>
          <CardDescription>
            Your most ordered menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-10 w-10 rounded-md object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.orderCount} orders</Badge>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
