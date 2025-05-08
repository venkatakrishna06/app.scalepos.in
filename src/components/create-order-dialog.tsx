import { useState, useEffect } from 'react';
import { Search, Plus, Minus, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { useOrderStore, useMenuStore, useStaffStore } from '@/lib/store';
import { MenuItem, Order, OrderItem } from '@/types';
import { toast } from 'sonner';

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
  const { currentStaff } = useStaffStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(
    existingOrder?.items || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setOrderItems(existingOrder?.items || []);
    }
  }, [open, existingOrder]);

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

        const totalAmount = itemsWithDetails.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        );

        await addItemsToOrder(existingOrder.id, itemsWithDetails);
        toast.success('Order updated successfully');
      } else {
        const newOrder = {
          table_id: table_id,
          customer_id: 1, // Default for walk-in customers
          staff_id: currentStaff?.id || 1,
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
    } catch (error) {
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

  return (
      <Dialog open={open}>
        <DialogContent 
          onClose={!isSubmitting ? onClose : undefined}
          className="h-[90vh] max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw]">
          {/*<DialogHeader>*/}
          {/*  <DialogTitle>*/}
          {/*    {existingOrder ? 'Update Order' : 'Create New Order'}*/}
          {/*  </DialogTitle>*/}
          {/*</DialogHeader>*/}
          <div className="flex h-full flex-col md:flex-row">
            <div className="border-b bg-gray-50 p-2 md:w-48 md:border-b-0 md:border-r">
              <div className="mb-2">
                <button
                    className={`w-full rounded-md p-2 text-left text-sm ${
                        selectedCategory === 'all'
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory('all')}
                >
                  All Items
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto md:block md:space-y-1">
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`whitespace-nowrap rounded-md p-2 text-left text-sm md:w-full ${
                            selectedCategory === category.id.toString()
                                ? 'bg-primary text-white'
                                : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedCategory(category.id.toString())}
                    >
                      {category.name}
                    </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col md:flex-row">
              <div className="flex-1 overflow-auto p-4">
                <div className="sticky top-0 z-10 bg-white pb-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {filteredItems.map(item => (
                      <div
                          key={item.id}
                          className="group flex items-center gap-3 rounded-md border bg-card p-3 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-md object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium leading-tight">{item.name}</h3>
                          <div className="mt-1 items-center justify-between">
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
                              <span className="w-6 text-center text-sm">
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

              <div className="border-t bg-gray-50 p-4 md:w-72 md:border-l md:border-t-0">
                <div className="sticky top-4">
                  <h2 className="text-base font-semibold">Order Summary</h2>
                  <div className="mt-4 space-y-3 max-h-[calc(100vh-300px)] overflow-auto">
                    {orderItems.map(item => {
                      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
                      if (!menuItem) return null;
                      return (
                          <div key={item.id} className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{menuItem.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>₹{menuItem.price.toFixed(2)} × {item.quantity}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                      className="text-gray-400 hover:text-gray-600"
                                      onClick={() => handleQuantityChange(menuItem, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <button
                                      className="text-gray-400 hover:text-gray-600"
                                      onClick={() => handleQuantityChange(menuItem, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm font-semibold">
                              ₹{(menuItem.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3 border-t pt-3">
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
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
        </DialogContent>
      </Dialog>
  );
}
