import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  ChevronRight, 
  Loader2, 
  ChevronDown, 
  X, 
  Menu as MenuIcon, 
  ShoppingCart 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Button } from './ui/button';
import { useOrderStore, useMenuStore } from '@/lib/store';
import { MenuItem, Order, OrderItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from "@/lib/store/auth.store.ts";
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  table_id?: number;
  onCreateOrder: (items: OrderItem[]) => void;
  existingOrder?: Order | null;
}

export function CreateOrderDialog({
                                    open,
                                    onClose,
                                    table_id,
                                    onCreateOrder,
                                    existingOrder
                                  }: CreateOrderDialogProps) {
  const { addOrder, addItemsToOrder } = useOrderStore();
  const { menuItems, categories } = useMenuStore();
  const { user } = useAuthStore();
  const { canCancelOrders, canCancelOrderItems } = usePermissions();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(
    existingOrder?.items || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === parseInt(selectedCategory);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAvailability = item.available;
    return matchesCategory && matchesSearch && matchAvailability;
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
          id: Date.now(), // Temporary ID until saved
          order_id: existingOrder?.id || 0,
          menu_item_id: item.id,
          quantity: 1,
          notes: ''
        }];
      }
      return current;
    });
  };

  const getItemQuantity = (itemId: number) => {
    return orderItems.find(item => item.menu_item_id === itemId)?.quantity || 0;
  };

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);

      if (existingOrder) {
        const itemsWithDetails = orderItems.map(item => {
          const menuItem = menuItems.find(m => m.id === item.menu_item_id);
          return {
            ...item,
            price: menuItem?.price || 0,
            name: menuItem?.name || ''
          };
        });

        // Calculate total amount for logging or future use
        await addItemsToOrder(existingOrder.id, itemsWithDetails);
        toast.success('Order updated successfully');
      } else {
        const newOrder = {
          table_id: table_id,
          customer_id: 1, // Default for walk-in customers
          staff_id: user?.staff_id ,
          status: 'placed' as const,
          order_time: new Date().toISOString(),
          items: orderItems.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        };
        await addOrder(newOrder);
        toast.success('Order created successfully');
      }

      onCreateOrder(orderItems);
      setOrderItems([]);
      setSearchQuery('');
      setSelectedCategory('all');
    } catch {
      toast.error('Failed to process order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = orderItems.reduce(
      (sum, item) => {
        const menuItem = menuItems.find(m => m.id === item.menu_item_id);
        return sum + (menuItem?.price || 0) * item.quantity;
      },
      0
  );

  // Count total items
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
      <Dialog open={open}>
        <DialogContent 
          onClose={!isSubmitting ? onClose : undefined}
          className="h-[85vh] max-h-[600px] sm:max-h-[85vh] max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] p-0 sm:p-4">
          <div className="flex h-full flex-col">
            {/* Mobile header with toggle buttons */}
            <div className="flex items-center justify-between md:hidden p-2 border-b">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">{table_id ? `Table ${table_id}` : 'Takeaway Order'}</h2>
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

            <div className="flex flex-1 flex-col md:flex-row">
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
                  "flex-1 overflow-auto p-2 xs:p-3 sm:p-4",
                  isCartOpen ? "hidden md:block" : "block" // Hide on mobile when cart is open
                )}>
                  <div className="sticky top-0 z-10 bg-background pb-2 xs:pb-3">
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

                  <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-md border bg-card"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-md object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium leading-tight line-clamp-1">{item.name}</h3>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item, -1)}
                                disabled={getItemQuantity(item.id) === 0 || isSubmitting}
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">
                                {getItemQuantity(item.id)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item, 1)}
                                disabled={isSubmitting}
                                className="h-7 w-7 p-0"
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
                          {orderItems.map(item => {
                            const menuItem = menuItems.find(m => m.id === item.menu_item_id);
                            if (!menuItem) return null;
                            return (
                              <div key={item.id} className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{menuItem.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ₹{(menuItem.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                                    onClick={() => handleQuantityChange(menuItem, -1)}
                                    disabled={isSubmitting}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                                  <button
                                    className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                                    onClick={() => handleQuantityChange(menuItem, 1)}
                                    disabled={isSubmitting}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
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
                          onClick={handleSubmitOrder}
                          disabled={orderItems.length === 0 || isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <span>{existingOrder ? 'Update Order' : 'Place Order'}</span>
                              <ChevronRight className="h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
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
        </DialogContent>
      </Dialog>
  );
}
