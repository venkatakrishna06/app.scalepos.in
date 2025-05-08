import { useState, useEffect } from 'react';
import { CreditCard, Users, Coffee, Clock, Search, Plus, Minus, ChevronRight, ShoppingBag, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderStore, useMenuStore } from '@/lib/store';
import { CreateOrderDialog } from '@/components/create-order-dialog';
import { MenuItem, OrderItem } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface DashboardProps {
  orderType: 'dine-in' | 'takeaway' | 'orders';
}

export default function Dashboard({ orderType }: DashboardProps) {
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { orders, addOrder, loading: ordersLoading } = useOrderStore();
  const { menuItems, categories, loading: menuLoading } = useMenuStore();

  const activeOrders = orders.filter(order => 
    order.status !== 'paid' && order.status !== 'cancelled'
  );

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id.toString() === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const handleQuantityChange = (item: MenuItem, delta: number) => {
    setOrderItems(current => {
      const existingItem = current.find(i => i.menu_item_id === item.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;
        if (newQuantity <= 0) {
          return current.filter(i => i.menu_item_id !== item.id);
        }
        return current.map(i =>
          i.menu_item_id === item.id ? { ...i, quantity: newQuantity } : i
        );
      }
      if (delta > 0) {
        return [...current, {
          id: Date.now(),
          order_id: 0,
          menu_item_id: item.id,
          quantity: 1,
          status: 'placed',
          notes: '',
          price: item.price,
          name: item.name
        }];
      }
      return current;
    });
  };

  const getItemQuantity = (itemId: number) => {
    return orderItems.find(item => item.menu_item_id === itemId)?.quantity || 0;
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) return;

    try {
      const newOrder = {
        customer_id: 1, // Default for walk-in customers
        order_type: 'takeaway' as const,
        staff_id: 1, // Current staff ID
        status: 'placed' as const,
        order_time: new Date().toISOString(),
        items: orderItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes || ''
        })),
        total_amount: totalAmount
      };

      await addOrder(newOrder);
      setOrderItems([]);
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  if (ordersLoading || menuLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (orderType === 'orders') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Active Orders</h2>
          <Select defaultValue="all">
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Order #{order.id}
                  </span>
                  <h3 className="mt-1 font-semibold">
                    {order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table_id}`}
                  </h3>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  order.status === 'placed' && "bg-blue-100 text-blue-800",
                  order.status === 'preparing' && "bg-yellow-100 text-yellow-800",
                  order.status === 'served' && "bg-green-100 text-green-800"
                )}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(order.order_time).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-lg font-semibold">
                  ₹{order.total_amount?.toFixed(2)}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-end gap-2 border-t bg-background/95 p-4 backdrop-blur transition-transform group-hover:translate-y-0">
                <Button variant="outline" size="sm">View Details</Button>
                <Button size="sm">Update Status</Button>
              </div>
            </div>
          ))}
        </div>

        {activeOrders.length === 0 && (
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-muted-foreground">No active orders</p>
              <Button variant="outline" className="mt-4">
                Create New Order
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (orderType === 'takeaway') {
    return (
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Categories Sidebar */}
        <div className="w-48 space-y-4 rounded-lg border bg-card p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
            <button
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                selectedCategory === 'all'
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  selectedCategory === category.id.toString()
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex flex-1 overflow-hidden rounded-lg border bg-card">
          <div className="flex h-full">
            <div className="flex-1 overflow-auto p-6">
              <div className="sticky top-0 z-10 mb-6 bg-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          ₹{item.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={getItemQuantity(item.id) === 0}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {getItemQuantity(item.id)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(item, 1)}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <p className="text-muted-foreground">No items found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="w-80 border-l bg-card/50">
              <div className="flex h-full flex-col p-6">
                <div className="mb-6">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </h2>
                </div>

                <div className="flex-1 space-y-4 overflow-auto">
                  {orderItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 rounded-lg border bg-card p-4"
                    >
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            ₹{item.price?.toFixed(2)} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            ₹{((item.price || 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange({ id: item.menu_item_id } as MenuItem, -1)}
                            className="h-6 w-6"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange({ id: item.menu_item_id } as MenuItem, 1)}
                            className="h-6 w-6"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full justify-between"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0}
                  >
                    <span>Place Order</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Menu Items</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button onClick={() => setShowOrderDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
            onClick={() => setShowOrderDialog(true)}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium">{item.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold">
                  ₹{item.price.toFixed(2)}
                </span>
                <Button size="sm">Add</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        table_id={1}
        onCreateOrder={() => setShowOrderDialog(false)}
        orderType="dine-in"
      />
    </div>
  );
}