import { useState } from 'react';
import { CreditCard, Users, Utensils, Clock, Search, Plus, Minus, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderStore, useMenuStore } from '@/lib/store';
import { CreateOrderDialog } from '@/components/create-order-dialog';
import { MenuItem, OrderItem } from '@/types';

interface DashboardProps {
  orderType: 'dine-in' | 'takeaway' | 'orders';
}

export default function Dashboard({ orderType }: DashboardProps) {
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { orders, addOrder } = useOrderStore();
  const { menuItems, categories } = useMenuStore();

  const activeOrders = orders.filter(order => 
    order.status !== 'paid' && order.status !== 'cancelled'
  );

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const handleQuantityChange = (item: MenuItem, delta: number) => {
    setOrderItems(current => {
      const existingItem = current.find(i => i.id === item.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;
        if (newQuantity <= 0) {
          return current.filter(i => i.id !== item.id);
        }
        return current.map(i =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        );
      }
      if (delta > 0) {
        return [...current, { ...item, quantity: 1 }];
      }
      return current;
    });
  };

  const getItemQuantity = (itemId: number) => {
    return orderItems.find(item => item.id === itemId)?.quantity || 0;
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = () => {
    if (orderItems.length === 0) return;

    const newOrder = {
      status: 'placed' as const,
      order_type: 'takeaway' as const,
      order_time: new Date().toISOString(),
      items: orderItems.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        notes: item.notes || ''
      }))
    };
    addOrder(newOrder);
    setOrderItems([]);
  };

  if (orderType === 'orders') {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border bg-white p-3">
          <h2 className="text-sm font-semibold">Active Orders</h2>
          <div className="mt-2 space-y-2">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border bg-gray-50 p-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium">
                      {order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table_id}`} #{order.id}
                    </span>
                    <p className="text-xs text-gray-500">
                      {order.items.length} items
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t pt-1.5">
                  <span className="text-xs text-gray-500">
                    {new Date(order.order_time).toLocaleTimeString()}
                  </span>
                  <span className="text-xs font-semibold">
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'takeaway') {
    return (
      <div className="flex h-[calc(100vh-8rem)] gap-3">
        {/* Categories Sidebar */}
        <div className="w-40 rounded-lg border bg-white p-2">
          <div className="mb-1.5">
            <button
              className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </button>
          </div>
          <div className="space-y-0.5">
            {categories.map(category => (
              <button
                key={category.id}
                className={`w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-hidden rounded-lg border bg-white">
          <div className="flex h-full">
            <div className="flex-1 overflow-auto p-3">
              <div className="sticky top-0 z-10 bg-white pb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-full rounded border-2 bg-gray-50 pl-7 pr-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded border bg-white transition-shadow hover:shadow-sm"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2">
                      <div className="mb-1.5 flex items-start justify-between">
                        <h3 className="text-xs font-medium">{item.name}</h3>
                        <span className="text-xs font-semibold text-blue-600">₹{item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 rounded border bg-gray-50 p-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={getItemQuantity(item.id) === 0}
                            className="h-5 w-5"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-xs font-medium">
                            {getItemQuantity(item.id)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item, 1)}
                            className="h-5 w-5"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-64 border-l bg-gray-50 p-3">
              <div className="sticky top-3">
                <div className="mb-3 flex items-center gap-1.5">
                  <div className="rounded-full bg-blue-100 p-1 text-blue-600">
                    <ShoppingBag className="h-3 w-3" />
                  </div>
                  <h2 className="text-sm font-semibold">Order Summary</h2>
                </div>
                <div className="max-h-[calc(100vh-16rem)] space-y-2 overflow-auto">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-start gap-2 rounded bg-white p-1.5 shadow-sm">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-medium">{item.name}</h4>
                        <div className="mt-0.5 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            ₹{item.price.toFixed(2)} × {item.quantity}
                          </span>
                          <span className="text-xs font-medium">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <button
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            onClick={() => handleQuantityChange(item, -1)}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <button
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Total Amount</span>
                    <span className="text-sm font-semibold text-blue-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full justify-between py-2 text-xs font-medium"
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0}
                  >
                    <span>Place Order</span>
                    <ChevronRight className="h-3 w-3" />
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search menu items..."
          className="h-7 w-full rounded border bg-white pl-7 pr-2 text-xs"
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Menu Items</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="rounded border bg-white p-2 shadow-sm"
              onClick={() => setShowOrderDialog(true)}
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-20 w-full rounded object-cover"
              />
              <h3 className="mt-1.5 text-xs font-medium">{item.name}</h3>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold">₹{item.price.toFixed(2)}</span>
                <Button size="sm" className="h-6 px-2 py-0.5 text-xs">Add</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        tableId={1}
        onCreateOrder={() => setShowOrderDialog(false)}
        orderType="dine-in"
      />
    </div>
  );
}