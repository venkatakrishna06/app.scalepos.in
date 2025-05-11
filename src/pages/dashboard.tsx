import { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  Plus, 
  Minus, 
  ChevronRight, 
  Loader2, 
  ChevronDown,
  AlertCircle,
  Menu as MenuIcon,
  X,
  FileText,
  LayoutGrid,
  LayoutList,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderStore, useMenuStore } from '@/lib/store';
import { CreateOrderDialog } from '@/components/create-order-dialog';
import { DashboardHome } from '@/components/DashboardHome';
import { MenuItem, OrderItem } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useAuthStore } from "@/lib/store/auth.store.ts";
import { toast } from "sonner";
import { usePermissions } from '@/hooks/usePermissions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
  orderType: 'dine-in' | 'takeaway' | 'orders';
}

export default function Dashboard({ orderType }: DashboardProps) {
  // Dialog state
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // Filter and search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Store state
  const { orders, addOrder, loading: ordersLoading, error: ordersError } = useOrderStore();
  const { menuItems, categories, loading: menuLoading, error: menuError } = useMenuStore();
  const { user } = useAuthStore();
  const { canCreateOrders, canCancelOrders } = usePermissions();

  // Effect to set initial sidebar state based on screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);


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
      setError(null);

      const newOrder = {
        customer_id: 1, // Default for walk-in customers
        order_type: 'takeaway' as const,
        staff_id: user?.staff_id, // Current staff ID
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
      toast.success('Order placed successfully!');
      setOrderItems([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to place order:', err);
    }
  };

  // Group categories by parent/child relationship
  const mainCategories = categories.filter(cat => !cat.parent_category_id);
  const subCategoriesByParent = categories.reduce((acc, cat) => {
    if (cat.parent_category_id) {
      if (!acc[cat.parent_category_id]) {
        acc[cat.parent_category_id] = [];
      }
      acc[cat.parent_category_id].push(cat);
    }
    return acc;
  }, {} as Record<number, typeof categories>);

  // Initialize all categories as expanded by default
  const initialExpandedState = mainCategories.reduce((acc, category) => {
    if (subCategoriesByParent[category.id]) {
      acc[category.id] = true;
    }
    return acc;
  }, {} as Record<number, boolean>);

  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(initialExpandedState);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Enhanced loading state
  if (ordersLoading || menuLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">Loading Dashboard</p>
          <p className="text-sm text-muted-foreground">
            {ordersLoading && menuLoading ? "Loading orders and menu items..." : 
             ordersLoading ? "Loading orders..." : "Loading menu items..."}
          </p>
        </div>
      </div>
    );
  }

  // Error handling
  if (ordersError || menuError) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <p className="font-medium text-destructive">Error Loading Dashboard</p>
          <p className="text-sm text-muted-foreground">
            {ordersError || menuError}
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

  // Show dashboard home when not in a specific order type view
  if (orderType !== 'takeaway' && orderType !== 'orders') {
    return <DashboardHome />;
  }

  if (orderType === 'orders') {
    // Filter orders based on status
    const filteredOrders = activeOrders.filter(order => {
      if (filterStatus === 'all') return true;
      return order.status === filterStatus;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Active Orders</h2>

          <div className="flex flex-wrap items-center gap-2">
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
            <Card
              key={order.id}
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
      </div>
    );
  }

  if (orderType === 'takeaway') {
    // Count total items
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-6">
        {/* Mobile header with toggle buttons */}
        <div className="flex items-center justify-between md:hidden p-2 border-b">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Takeaway Order</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setIsCartOpen(!isCartOpen)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mx-4 mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Categories Sidebar - Collapsible on mobile */}
        <div className={cn(
          "border-b bg-muted p-2 md:w-48 md:border-b-0 md:border-r dark:border-border",
          "md:relative md:block", // Always visible on desktop
          isSidebarOpen ? "block" : "hidden" // Toggle on mobile
        )}>
          {/* Mobile close button */}
          <div className="flex items-center justify-between mb-2 md:hidden">
            <h3 className="font-medium">Categories</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2">
            <button
              className={cn(
                "w-full rounded-md p-2 text-left text-sm",
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {/* Main Categories with Expandable Subcategories */}
            {mainCategories.map(category => (
              <div key={category.id} className="category-group">
                <div className="flex items-center w-full">
                  {subCategoriesByParent[category.id] && (
                    <button 
                      onClick={() => toggleCategory(category.id)}
                      className="p-1 rounded hover:bg-accent"
                    >
                      <ChevronDown 
                        className={cn(
                          "h-3 w-3 transition-transform",
                          expandedCategories[category.id] && "transform rotate-180"
                        )} 
                      />
                    </button>
                  )}
                  <button
                    className={cn(
                      "flex-1 rounded-md p-2 text-left text-sm",
                      selectedCategory === category.id.toString()
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={() => setSelectedCategory(category.id.toString())}
                  >
                    {category.name}
                  </button>
                </div>

                {/* Subcategories section */}
                {expandedCategories[category.id] && subCategoriesByParent[category.id] && (
                  <div className="ml-5 mt-1 space-y-1 border-l-2 border-muted-foreground/20 pl-1">
                    {subCategoriesByParent[category.id].map(subCategory => (
                      <button
                        key={subCategory.id}
                        className={cn(
                          "w-full rounded-md p-2 text-left text-sm",
                          selectedCategory === subCategory.id.toString()
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => setSelectedCategory(subCategory.id.toString())}
                      >
                        {subCategory.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items and Order Summary */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Menu Items Section */}
          <div className={cn(
            "flex-1 overflow-auto p-4",
            isCartOpen ? "hidden md:block" : "block" // Hide on mobile when cart is open
          )}>
            <div className="sticky top-0 z-10 bg-background pb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-md object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium leading-tight">{item.name}</h3>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={getItemQuantity(item.id) === 0}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">
                            {getItemQuantity(item.id)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-semibold">No Items Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or selecting a different category
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Section - Collapsible on mobile */}
          <div className={cn(
            "border-t bg-muted md:w-72 md:border-l md:border-t-0 flex flex-col h-full dark:border-border",
            "md:relative md:block", // Always visible on desktop
            isCartOpen ? "fixed inset-0 z-50 bg-background" : "hidden", // Toggle on mobile
            "md:static md:z-auto" // Reset on desktop
          )}>
            <div className="flex flex-col h-full">
              {/* Mobile close button */}
              <div className="flex items-center justify-between p-4 md:hidden">
                <h2 className="text-base font-semibold">Your Order</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setIsCartOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 md:block hidden">
                <h2 className="text-base font-semibold">Order Summary</h2>
              </div>

              <div className="flex-1 overflow-auto px-4 pb-4">
                {orderItems.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Your order is empty</p>
                    <p className="text-xs text-muted-foreground mt-1">Add items from the menu to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{(item.price * item.quantity).toFixed(2)} ({item.quantity} × ₹{item.price.toFixed(2)})
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={() => handleQuantityChange({ id: item.menu_item_id } as MenuItem, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <button
                            className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={() => handleQuantityChange({ id: item.menu_item_id } as MenuItem, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t mt-auto bg-muted dark:border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-lg font-semibold text-primary">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full justify-between py-4 text-base"
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0}
                  >
                    <span>Place Order</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating cart button on mobile */}
        {!isCartOpen && orderItems.length > 0 && (
          <Button
            className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary">
                {totalItems}
              </span>
            </div>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Menu Items</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
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
          {canCreateOrders && (
            <Button onClick={() => setShowOrderDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          )}
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
        viewMode === 'grid' 
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-1"
      )}>
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="group relative overflow-hidden transition-shadow hover:shadow-md"
          >
            {viewMode === 'grid' ? (
              <>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      ₹{item.price.toFixed(2)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item, 1);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center p-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 rounded-md object-cover mr-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold whitespace-nowrap">
                    ₹{item.price.toFixed(2)}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item, 1);
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-semibold">No Items Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria
          </p>
        </div>
      )}

      {/* Floating cart button on mobile */}
      {orderItems.length > 0 && (
        <Button
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden"
          onClick={() => setShowOrderDialog(true)}
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary">
              {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </Button>
      )}

      <CreateOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        table_id={1}
        onCreateOrder={() => setShowOrderDialog(false)}
        existingOrder={orderItems.length > 0 ? { items: orderItems } as Order : undefined}
      />
    </div>
  );
}
