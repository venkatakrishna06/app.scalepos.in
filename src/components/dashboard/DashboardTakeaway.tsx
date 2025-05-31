import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {AlertCircle, ChevronRight, Menu as MenuIcon, Minus, Pencil, Plus, Search, ShoppingCart, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useMenuStore, useOrderStore} from '@/lib/store';
import {Category, MenuItem, Order, OrderItem} from '@/types';
import {cn} from '@/lib/utils';
import {useAuthStore} from "@/lib/store/auth.store";
import {toast} from '@/lib/toast';
import {Card} from '@/components/ui/card';
import {PaymentDialog} from '@/components/payment-dialog';

interface DashboardTakeawayProps {
  /** Optional callback when an order is created */
  onOrderCreated?: () => void;
}

/**
 * Component for creating takeaway orders in the dashboard
 * 
 * This component is responsible for:
 * - Displaying menu items for selection
 * - Filtering menu items by category and search
 * - Managing a shopping cart of selected items
 * - Creating takeaway orders
 */
const DashboardTakeawayComponent: React.FC<DashboardTakeawayProps> = ({ 
  onOrderCreated 
}) => {
  // Category and search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [draftOrder, setDraftOrder] = useState<Omit<Order, 'id'> | null>(null);

  // Note editing state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemNote, setItemNote] = useState<string>('');

  // Store state
  const { menuItems, getMenuItemsByCategory, getMainCategories, getSubcategories } = useMenuStore();
  const { calculateOrderTotals } = useOrderStore();
  const { user } = useAuthStore();

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

  // Get main categories and subcategories using selectors
  const mainCategories = useMemo(() => getMainCategories(), [getMainCategories]);

  // Initialize all categories as expanded by default
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(
    mainCategories.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {} as Record<number, boolean>)
  );

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Get filtered menu items using selector
  const filteredItems = useMemo(() => {
    const items = selectedCategory === 'all' 
      ? menuItems 
      : getMenuItemsByCategory(parseInt(selectedCategory));

    // Apply search filter
    if (searchQuery) {
      return items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        item.available
      );
    }

    return items.filter(item => item.available);
  }, [menuItems, selectedCategory, searchQuery, getMenuItemsByCategory]);

  // Handle quantity change for an item
  const handleQuantityChange = useCallback((item: MenuItem, delta: number) => {
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
  }, []);

  // Get quantity for an item
  const getItemQuantity = useCallback((itemId: number) => {
    return orderItems.find(item => item.menu_item_id === itemId)?.quantity || 0;
  }, [orderItems]);

  // Handle note editing for an item
  const handleEditNote = useCallback((itemId: number, currentNote: string) => {
    setEditingItemId(itemId);
    setItemNote(currentNote);
  }, []);

  // Save note for an item
  const handleSaveNote = useCallback(() => {
    if (editingItemId !== null) {
      setOrderItems(current => 
        current.map(item => 
          item.id === editingItemId 
            ? { ...item, notes: itemNote } 
            : item
        )
      );
      setEditingItemId(null);
      setItemNote('');
    }
  }, [editingItemId, itemNote]);

  // Calculate total amount
  const totalAmount = useMemo(() => 
    orderItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    ),
  [orderItems]);

  // Calculate total items
  const totalItems = useMemo(() => 
    orderItems.reduce((sum, item) => sum + item.quantity, 0),
  [orderItems]);

  // Function to print KOT (Kitchen Order Ticket)
  const handlePrintKOT = useCallback(() => {
    // Check if we have items to print
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return;
    }

    // Create a new window for the KOT
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the KOT');
      return;
    }

    // Get current date and time
    const now = new Date();
    const dateFormatted = now.toLocaleDateString();
    const timeFormatted = now.toLocaleTimeString();

    // Generate KOT HTML content
    const kotContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kitchen Order Ticket</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            max-width: 80mm; /* Standard receipt width */
            margin: 0 auto;
          }
          .receipt {
            border: 1px solid #ddd;
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 8px;
          }
          .restaurant-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .restaurant-details {
            font-size: 11px;
            margin-bottom: 3px;
            line-height: 1.2;
          }
          .bill-info {
            margin-bottom: 12px;
            font-size: 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, auto);
            gap: 4px 8px;
          }
          .bill-info div {
            margin-bottom: 2px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11px;
          }
          .items-table th {
            text-align: left;
            padding: 3px 0;
            border-bottom: 1px solid #ddd;
          }
          .items-table td {
            padding: 3px 0;
            border-bottom: 1px dashed #eee;
          }
          .amount-details {
            margin-top: 8px;
            font-size: 11px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 13px;
            margin-top: 4px;
            border-top: 1px solid #ddd;
            padding-top: 4px;
          }
          .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 11px;
            border-top: 1px dashed #ccc;
            padding-top: 8px;
          }
          .footer p {
            margin: 2px 0;
          }
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
            .receipt {
              border: none;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="restaurant-name">KITCHEN ORDER TICKET</div>
            <div class="restaurant-details">Date: ${dateFormatted} Time: ${timeFormatted}</div>
          </div>

          <div class="bill-info">
            <div><strong>KOT No:</strong> ${Date.now().toString().slice(-6)}</div>
            <div><strong>Table:</strong> Takeaway</div>
            <div><strong>Server:</strong> ${user?.name || 'N/A'}</div>
            <div><strong>Type:</strong> Takeaway</div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => {
                return `
                  <tr>
                    <td>${item.name || 'Unknown Item'}</td>
                    <td>${item.quantity}</td>
                    <td>${item.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>*** Kitchen Copy ***</p>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print();" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print KOT
          </button>
          <button onclick="window.close();" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; margin-left: 10px; cursor: pointer;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(kotContent);
    printWindow.document.close();

    // Trigger print when content is loaded
    printWindow.onload = function() {
      // Automatically print on load (optional)
      // printWindow.print();
    };

    toast.success('KOT generated successfully');
  }, [orderItems, user]);

  // Handle order submission
  const handlePlaceOrder = useCallback(async () => {
    if (orderItems.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Calculate GST amounts
      const { subTotal, sgstAmount, cgstAmount, totalAmount: calculatedTotal } = calculateOrderTotals(
        orderItems.map(item => ({
          ...item,
          price: item.price,
          quantity: item.quantity
        }))
      );

      // Default GST rates
      const sgstRate = 2.5;
      const cgstRate = 2.5;

      // Prepare the order data but don't create it yet
      const draftOrder = {
        order_type: 'takeaway' as const,
        customer_id: 1, // Default for walk-in customers
        staff_id: user?.staff_id,
        status: 'placed' as const,
        order_time: new Date().toISOString(),
        items: orderItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes || '',
          name: item.name,
          price: item.price
        })),
        // Include GST calculations
        sub_total: subTotal,
        sgst_rate: sgstRate,
        cgst_rate: cgstRate,
        sgst_amount: sgstAmount,
        cgst_amount: cgstAmount,
        total_amount: calculatedTotal
      };

      // Show payment dialog with draft order
      setCreatedOrder(null);
      setShowPaymentDialog(true);

      // Store the draft order to pass to the payment dialog
      // The actual order will be created after payment is successful
      setDraftOrder(draftOrder);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to prepare order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [orderItems, user?.staff_id, calculateOrderTotals]);

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
            <CategoryItem 
              key={category.id}
              category={category}
              selectedCategory={selectedCategory}
              isExpanded={expandedCategories[category.id]}
              onToggleExpand={() => toggleCategory(category.id)}
              onSelectCategory={(id) => setSelectedCategory(id.toString())}
              getSubcategories={getSubcategories}
            />
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
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={getItemQuantity(item.id)}
                onChangeQuantity={handleQuantityChange}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="h-10 w-10 text-muted-foreground mb-2">🍽️</div>
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
                    <OrderItemRow
                      key={item.id}
                      item={item}
                      onChangeQuantity={(delta) => handleQuantityChange({ id: item.menu_item_id } as MenuItem, delta)}
                      onEditNote={() => handleEditNote(item.id, item.notes)}
                      isEditing={editingItemId === item.id}
                      currentNote={editingItemId === item.id ? itemNote : item.notes}
                      onNoteChange={setItemNote}
                      onSaveNote={handleSaveNote}
                    />
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
                  onClick={handlePrintKOT}
                  disabled={orderItems.length === 0 || isSubmitting}
                  variant="outline"
                >
                  <span>Kitchen Order Ticket (KOT)</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  className="w-full justify-between py-4 text-base"
                  onClick={handlePlaceOrder}
                  disabled={orderItems.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
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

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setCreatedOrder(null);
          setDraftOrder(null);

          // Only reset the order state if payment was cancelled, not completed
          if (!createdOrder) {
            setOrderItems([]);
            setSearchQuery('');
            setSelectedCategory('all');
          }
        }}
        order={createdOrder}
        draftOrder={draftOrder}
        onPaymentComplete={(order) => {
          // Store the created order
          setCreatedOrder(order);

          // Reset state after payment is complete
          setOrderItems([]);
          setSearchQuery('');
          setSelectedCategory('all');

          // Notify parent if needed
          if (onOrderCreated) {
            onOrderCreated();
          }

          toast.success('Takeaway order successfully');
        }}
      />
    </div>
  );
};

// Memoized CategoryItem component
const CategoryItem = memo(({ 
  category, 
  selectedCategory, 
  isExpanded, 
  onToggleExpand, 
  onSelectCategory,
  getSubcategories
}: { 
  category: Category; 
  selectedCategory: string; 
  isExpanded: boolean; 
  onToggleExpand: () => void; 
  onSelectCategory: (id: number) => void;
  getSubcategories: (parentId: number) => Category[];
}) => {
  const subcategories = useMemo(() => 
    getSubcategories(category.id), 
    [category.id, getSubcategories]
  );

  const hasSubcategories = subcategories.length > 0;

  return (
    <div className="category-group">
      <div className="flex items-center w-full">
        {hasSubcategories && (
          <button 
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-accent"
            aria-label={isExpanded ? "Collapse category" : "Expand category"}
          >
            <svg 
              className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "transform rotate-180"
              )} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        <button
          className={cn(
            "flex-1 rounded-md p-2 text-left text-sm",
            selectedCategory === category.id.toString()
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          )}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.name}
        </button>
      </div>

      {/* Subcategories section */}
      {isExpanded && hasSubcategories && (
        <div className="ml-5 mt-1 space-y-1 border-l-2 border-muted-foreground/20 pl-1">
          {subcategories.map(subCategory => (
            <button
              key={subCategory.id}
              className={cn(
                "w-full rounded-md p-2 text-left text-sm",
                selectedCategory === subCategory.id.toString()
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => onSelectCategory(subCategory.id)}
            >
              {subCategory.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

CategoryItem.displayName = 'CategoryItem';

// Memoized MenuItemCard component
const MenuItemCard = memo(({ 
  item, 
  quantity, 
  onChangeQuantity 
}: { 
  item: MenuItem; 
  quantity: number; 
  onChangeQuantity: (item: MenuItem, delta: number) => void;
}) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onChangeQuantity(item, 1)}
    >
      <div className="flex items-center gap-3 p-3">
        <img
          src={item.image}
          alt={item.name}
          className="h-16 w-16 rounded-md object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium leading-tight">{item.name}</h3>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
            {quantity > 0 && (
              <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">
                Qty: {quantity}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

// Memoized OrderItemRow component
const OrderItemRow = memo(({ 
  item, 
  onChangeQuantity,
  onEditNote,
  isEditing,
  currentNote,
  onNoteChange,
  onSaveNote
}: { 
  item: OrderItem; 
  onChangeQuantity: (delta: number) => void;
  onEditNote: () => void;
  isEditing: boolean;
  currentNote: string;
  onNoteChange: (note: string) => void;
  onSaveNote: () => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            ₹{(item.price * item.quantity).toFixed(2)} ({item.quantity} × ₹{item.price.toFixed(2)})
          </p>
          {item.notes && !isEditing && (
            <p className="text-xs italic text-muted-foreground mt-1">
              Note: {item.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => onChangeQuantity(-1)}
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-sm">{item.quantity}</span>
          <button
            className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => onChangeQuantity(1)}
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onEditNote();
            }}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={currentNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add note for this item..."
            className="flex-1 h-8 px-2 text-sm border rounded-md"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveNote();
              }
            }}
          />
          <Button
            size="sm"
            onClick={onSaveNote}
            className="h-8 px-2"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

// Export the memoized component
export const DashboardTakeaway = memo(DashboardTakeawayComponent);
