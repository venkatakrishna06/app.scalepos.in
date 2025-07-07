import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  Menu as MenuIcon,
  Minus,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Star,
  X
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useMenuStore, useOrderStore, usePaymentStore, useRestaurantStore} from '@/lib/store';
import {MenuItem, Order, OrderItem} from '@/types';
import {cn} from '@/lib/utils';
import {useAuthStore} from "@/lib/store/auth.store";
import {useOrder} from '@/lib/hooks/useOrder';
import {orderService} from "@/lib/api/services";
import {toast} from '@/lib/toast';
import {Card} from '@/components/ui/card';
import {motion} from 'framer-motion';
import {analyticsService} from '@/lib/api/services/analytics.service';
import {MenuItemAnalytics} from '@/types/analytics';

interface DashboardTakeawayProps {
  /** Optional callback when an order is created */
  onOrderCreated?: () => void;
  type:string
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
  onOrderCreated,
  type
}) => {
  // Category and search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favouriteItems, setFavouriteItems] = useState<MenuItemAnalytics[]>([]);
  const [isLoadingFavourites, setIsLoadingFavourites] = useState(false);

  // Note editing state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemNote, setItemNote] = useState<string>('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | ''>('');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // Store state
  const { menuItems, categories } = useMenuStore();
  const { calculateOrderTotals } = useOrderStore();
  const { user } = useAuthStore();
  const { addPayment } = usePaymentStore();
  const { updateOrderStatus } = useOrder();
  const { restaurant } = useRestaurantStore();

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

  // Effect to fetch most ordered items when page loads
  useEffect(() => {
    const fetchFavouriteItems = async () => {
      try {
        setIsLoadingFavourites(true);
        // Fetch the most ordered items, limit to 10, sort by quantity_sold in descending order
        const params = {
          limit: 10,
          sort_by: 'quantity_sold',
          order: 'desc' as const
        };
        const menuItemAnalytics = await analyticsService.getMenuItemAnalytics(params);
        setFavouriteItems(menuItemAnalytics);
      } catch {
        toast.error('Failed to load favourite items');
      } finally {
        setIsLoadingFavourites(false);
      }
    };

    fetchFavouriteItems();
  }, []);

  // Group categories by parent/child relationship
  const mainCategories = useMemo(() =>
    categories.filter(cat => !cat.parent_category_id),
  [categories]);

  const subCategoriesByParent = useMemo(() =>
    categories.reduce((acc, cat) => {
      if (cat.parent_category_id) {
        if (!acc[cat.parent_category_id]) {
          acc[cat.parent_category_id] = [];
        }
        acc[cat.parent_category_id].push(cat);
      }
      return acc;
    }, {} as Record<number, typeof categories>),
  [categories]);

  // Initialize all categories as expanded by default
  const initialExpandedState = useMemo(() =>
    mainCategories.reduce((acc, category) => {
      if (subCategoriesByParent[category.id]) {
        acc[category.id] = true;
      }
      return acc;
    }, {} as Record<number, boolean>),
  [mainCategories, subCategoriesByParent]);

  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(initialExpandedState);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Get filtered menu items
  const filteredItems = useMemo(() => {
    // If favourites is selected, show the most ordered items
    if (selectedCategory === 'favourites') {
      // Get the menu item IDs from the favouriteItems
      const favouriteItemIds = favouriteItems.map(item => item.menu_item_id);

      // Filter menu items to only include those in the favourites list
      return menuItems.filter(item => {
        const isFavourite = favouriteItemIds.includes(item.id);
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Don't filter by availability, show all items
        return isFavourite && matchesSearch;
      });
    }

    // Otherwise, use the regular category filtering
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category_id === parseInt(selectedCategory);
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      // Don't filter by availability, show all items
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery, favouriteItems]);

  // Handle quantity change for an item
  const handleQuantityChange = useCallback((item: MenuItem, delta: number) => {
    // Don't allow adding unavailable items
    if (!item.available && delta > 0) {
      return;
    }

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
          name: item.name,
          include_in_gst: item.include_in_gst
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


  // Calculate total items
  const totalItems = useMemo(() => 
    orderItems.reduce((sum, item) => sum + item.quantity, 0),
  [orderItems]);

  // Calculate GST amounts
  const gstDetails = useMemo(() => {
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

    return {
      subTotal,
      sgstAmount,
      cgstAmount,
      sgstRate,
      cgstRate,
      totalAmount: calculatedTotal,
      roundedAmount: Math.ceil(calculatedTotal),
      roundingDifference: Math.ceil(calculatedTotal) - calculatedTotal
    };
  }, [orderItems, calculateOrderTotals]);

  // Calculate change amount if cash payment
  const cashGivenNumber = cashGiven ? parseFloat(cashGiven) : 0;
  const changeAmount = cashGivenNumber > gstDetails.roundedAmount ? cashGivenNumber - gstDetails.roundedAmount : 0;

  // Function to print bill
  const handlePrintBill = useCallback((order: Order) => {
    // Create a new window for the bill
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the bill');
      return;
    }

    // Get current date and time
    const now = new Date();
    const dateFormatted = now.toLocaleDateString();
    const timeFormatted = now.toLocaleTimeString();

    // Generate bill HTML content
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Receipt - Order #${order.id}</title>
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
          .token-no-center {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            background: #fff;
            padding: 2px 10px;
            border: 2px dashed #222;
            border-radius: 6px;
            letter-spacing: 2px;
            display: block;
            margin: 10px auto 8px auto;
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
            <div class="restaurant-name">${restaurant?.name || 'Restaurant Name'}</div>
            <div class="restaurant-details">${restaurant?.address || 'Restaurant Address'}</div>
            <div class="restaurant-details">Phone: ${restaurant?.phone || 'Phone Number'}</div>
            <div class="restaurant-details">GST No: ${restaurant?.gst_number || 'GST Number'}</div>
          </div>

          <div class="bill-info">
            <div><strong>Bill No:</strong> ${order.id}</div>
            <div><strong>Date:</strong> ${dateFormatted}</div>
            <div><strong>Time:</strong> ${timeFormatted}</div>
            <div><strong>Type:</strong> ${order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}</div>
          </div>

          ${
            order.token_number
              ? `<div class="token-no-center">Token No: ${order.token_number}</div>`
              : ''
          }

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .filter(item => item.status !== 'cancelled')
                .map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <div class="amount-details">
            <div class="amount-row">
              <span>Subtotal:</span>
              <span>₹${order.sub_total.toFixed(2)}</span>
            </div>

            ${order.sgst_amount > 0 ? `
            <div class="amount-row">
              <span>SGST (${order.sgst_rate}%):</span>
              <span>₹${order.sgst_amount.toFixed(2)}</span>
            </div>
            ` : ''}

            ${order.cgst_amount > 0 ? `
            <div class="amount-row">
              <span>CGST (${order.cgst_rate}%):</span>
              <span>₹${order.cgst_amount.toFixed(2)}</span>
            </div>
            ` : ''}

            <div class="amount-row">
              <span>Rounding Adjustment:</span>
              <span>₹${(Math.ceil(order.total_amount) - order.total_amount).toFixed(2)}</span>
            </div>

            <div class="amount-row total-amount">
              <span>Total Amount:</span>
              <span>₹${Math.ceil(order.total_amount).toFixed(2)}</span>
            </div>

            <div class="amount-row" style="margin-top: 10px;">
              <span>Payment Method:</span>
              <span>${paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your visit!</p>
            <p>Please visit again</p>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print();" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Bill
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
    printWindow.document.write(billContent);
    printWindow.document.close();

    // Trigger print when content is loaded
    printWindow.onload = function() {
      // Automatically print on load (optional)
      // printWindow.print();
    };
  }, [restaurant, paymentMethod]);

  // Function to print KOT (Kitchen Order Ticket)
  const handlePrintKOT = useCallback(async () => {
    // Check if we have items to print
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return;
    }

    // Check if payment method is selected
    if (!paymentMethod) {
      setError('Please select a payment method');
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // First print the KOT
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

      // Generate a token number for the order
      const tokenNumber = `${type.charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`;

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
              <div><strong>KOT No:</strong> ${tokenNumber.slice(-6)}</div>
              <div><strong>Table:</strong> Takeaway</div>
              <div><strong>Server:</strong> ${user?.name || 'N/A'}</div>
              <div><strong>Type:</strong> ${type}</div>
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

      // Now place the order
      // Prepare the order data
      const newOrder = {
        order_type: type,
        customer_id: 1, // Default for walk-in customers
        staff_id: user?.staff_id,
        status: 'placed' as const,
        order_time: new Date().toISOString(),
        token_number: tokenNumber,
        items: orderItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes || '',
          name: item.name,
          price: item.price,
          include_in_gst: item.include_in_gst
        })),
        // Include GST calculations
        sub_total: gstDetails.subTotal,
        sgst_rate: gstDetails.sgstRate,
        cgst_rate: gstDetails.cgstRate,
        sgst_amount: gstDetails.sgstAmount,
        cgst_amount: gstDetails.cgstAmount,
        total_amount: gstDetails.totalAmount
      };

      // Create the order
      const createdOrder = await orderService.createOrder(newOrder);

      // Create payment object
      const payment = {
        order_id: createdOrder.id,
        amount: gstDetails.roundedAmount,
        payment_method: paymentMethod,
        payment_status: 'completed',
        transaction_id: `txn_${Date.now()}`,
      };

      // Process payment
      await addPayment(payment);

      // Update order status to 'paid'
      await updateOrderStatus({
        id: createdOrder.id,
        status: 'paid'
      });

      // Print the bill
      handlePrintBill(createdOrder);

      toast.success('Order placed and payment completed successfully');

      // Reset state after payment is complete
      setOrderItems([]);
      setSearchQuery('');
      setSelectedCategory('all');
      setIsCartOpen(false);
      setPaymentMethod('');
      setCashGiven('');

      // Notify parent if needed
      if (onOrderCreated) {
        onOrderCreated();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [orderItems, user, type, paymentMethod, gstDetails, setError, setIsSubmitting, user?.staff_id, addPayment, updateOrderStatus, handlePrintBill, onOrderCreated]);

  // Handle order submission
  const handlePlaceOrder = useCallback(async () => {
    if (orderItems.length === 0) return;

    // Check if payment method is selected
    if (!paymentMethod) {
      setError('Please select a payment method');
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Generate a token number for the order
      const tokenNumber = `${type.charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`;

      // Prepare the order data
      const newOrder = {
        order_type: type,
        customer_id: 1, // Default for walk-in customers
        staff_id: user?.staff_id,
        status: 'placed' as const,
        order_time: new Date().toISOString(),
        token_number: tokenNumber,
        items: orderItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes || '',
          name: item.name,
          price: item.price,
          include_in_gst: item.include_in_gst
        })),
        // Include GST calculations
        sub_total: gstDetails.subTotal,
        sgst_rate: gstDetails.sgstRate,
        cgst_rate: gstDetails.cgstRate,
        sgst_amount: gstDetails.sgstAmount,
        cgst_amount: gstDetails.cgstAmount,
        total_amount: gstDetails.totalAmount
      };

      // Create the order
      const createdOrder = await orderService.createOrder(newOrder);

      // Create payment object
      const payment = {
        order_id: createdOrder.id,
        amount: gstDetails.roundedAmount,
        payment_method: paymentMethod,
        payment_status: 'completed',
        transaction_id: `txn_${Date.now()}`,
      };

      // Process payment
      await addPayment(payment);

      // Update order status to 'paid'
      await updateOrderStatus({
        id: createdOrder.id,
        status: 'paid'
      });

      // Print the bill
      handlePrintBill(createdOrder);

      toast.success('Order placed and payment completed successfully');

      // Reset state after payment is complete
      setOrderItems([]);
      setSearchQuery('');
      setSelectedCategory('all');
      setIsCartOpen(false);
      setPaymentMethod('');
      setCashGiven('');

      // Notify parent if needed
      if (onOrderCreated) {
        onOrderCreated();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [orderItems, user?.staff_id, type, paymentMethod, gstDetails, cashGiven, addPayment, updateOrderStatus, onOrderCreated, handlePrintBill]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-1">
      {/* Mobile header with centered text */}
      <div className="flex items-center md:hidden p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
        <Button
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 absolute left-2"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold flex-1 text-center">{type === 'quick-bill' ? 'Quick Bill' : 'Takeaway Order'}</h2>
        <div className="w-8"></div> {/* Spacer to balance the header */}
      </div>

      {/* Error message if any */}
      {error && (
        <div className="mx-3 mb-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Categories Sidebar - Collapsible on mobile */}
      <div className={cn(
        "border-b bg-muted p-2 md:w-48 md:border-b-0 md:border-r dark:border-border custom-scrollbar",
        "md:relative md:block", // Always visible on desktop
        isSidebarOpen 
          ? "fixed inset-0 bottom-20 z-50 pt-14 pb-16 overflow-y-auto" // Full screen on mobile when open
          : "hidden", // Hidden on mobile when closed
        "md:static md:z-auto md:pt-0 md:pb-0" // Reset on desktop
      )}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-2 md:hidden sticky top-0 bg-muted z-10 pb-2">
          <h3 className="font-medium">Categories</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-2 space-y-1">
          <button
            className={cn(
              "w-full rounded-md p-2 text-left text-sm",
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={() => {
              setSelectedCategory('all');
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
          >
            All Items
          </button>
          <button
            className={cn(
              "w-full rounded-md p-2 text-left text-sm flex items-center",
              selectedCategory === 'favourites'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={() => {
              setSelectedCategory('favourites');
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
          >
            <Star className="h-4 w-4 mr-2" />
            Favourites
            {isLoadingFavourites && (
              <Loader2 className="h-3 w-3 ml-2 animate-spin" />
            )}
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
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="h-3 w-3 transition-transform" />
                    ) : (
                      <ChevronRight className="h-3 w-3 transition-transform" />
                    )}
                  </button>
                )}
                <button
                  className={cn(
                    "flex-1 rounded-md p-2 text-left text-sm",
                    selectedCategory === category.id.toString()
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => {
                    if (subCategoriesByParent[category.id]) {
                      // If this category has subcategories, toggle expansion
                      toggleCategory(category.id);
                    } else {
                      // If no subcategories, filter by this category
                      setSelectedCategory(category.id.toString());
                      if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }
                  }}
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
                      onClick={() => {
                        setSelectedCategory(subCategory.id.toString());
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
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
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Menu Items Section */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isCartOpen ? "hidden md:flex" : "flex" // Hide on mobile when cart is open
        )}>
          <div className="sticky top-0 z-10 bg-background p-2 xs:p-3 sm:p-3 shrink-0">
            <div className="flex items-center gap-2 md:hidden mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <MenuIcon className="h-4 w-4 mr-2" />
                Categories
              </Button>
            </div>
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

          <div className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-3 pt-0 custom-scrollbar">
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 auto-rows-max">
              {filteredItems.length > 0 ? filteredItems.map(item => (
                <Card
                  key={item.id}
                  className={`overflow-hidden ${item.available ? 'cursor-pointer hover:bg-accent/50' : 'cursor-not-allowed opacity-75'} transition-colors border-primary/10`}
                  onClick={() => handleQuantityChange(item, 1)}
                >
                  <div className="p-2 sm:p-3">
                    {!item.available && (
                      <div className="absolute top-1 right-1">
                        <span className="text-white text-xs font-bold px-1 py-0.5 bg-red-500 rounded">Unavailable</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-medium leading-tight text-sm line-clamp-2">{item.name}</h3>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                        {getItemQuantity(item.id) > 0 && (
                          <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                            Qty: {getItemQuantity(item.id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No menu items found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary Section - Collapsible on mobile */}
        <div className={cn(
          "border-t bg-muted md:w-[30rem] md:border-l md:border-t-0 flex flex-col dark:border-border overflow-hidden",
          "md:relative md:flex", // Changed block to flex for consistency
          isCartOpen ? "fixed inset-0 bottom-20 z-50 bg-background" : "hidden", // Toggle on mobile
          "md:static md:z-auto shrink-0" // Reset on desktop
        )}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Mobile close button */}
            <div className="flex items-center justify-between p-3 md:hidden shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b">
              <h2 className="text-base font-semibold">Your Order</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsCartOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-3 md:block hidden shrink-0">
              <h2 className="text-base font-semibold">Order Summary</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
              {orderItems.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Your order is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Add items from the menu to get started</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex flex-col gap-2 p-2 rounded-lg border border-primary/10 bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.notes && editingItemId !== item.id && (
                            <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="border rounded-md h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={() => handleQuantityChange({ id: item.menu_item_id, price: item.price, name: item.name } as MenuItem, -1)}
                            disabled={isSubmitting}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            className="border rounded-md h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={() => handleQuantityChange({ id: item.menu_item_id, price: item.price, name: item.name } as MenuItem, 1)}
                            disabled={isSubmitting}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            className="border rounded-md h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditNote(item.id, item.notes);
                            }}
                            disabled={isSubmitting}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {editingItemId === item.id && (
                        <motion.div
                          className="mt-1 flex gap-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <input
                            type="text"
                            value={itemNote}
                            onChange={(e) => setItemNote(e.target.value)}
                            placeholder="Add note for this item..."
                            className="flex-1 h-9 px-3 text-sm border rounded-md"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveNote();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveNote}
                            className="h-9 px-3"
                          >
                            Save
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t mt-auto bg-muted dark:border-border shrink-0">
              <div className="space-y-3">
                {/* Total amount with info icon */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setShowTaxDetails(!showTaxDetails)} 
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-semibold text-primary">₹{gstDetails.roundedAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tax details (collapsible) */}
                {showTaxDetails && (
                  <div className="text-xs space-y-1 bg-background/50 p-2 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₹{gstDetails.subTotal.toFixed(2)}</span>
                    </div>
                    {gstDetails.sgstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST ({gstDetails.sgstRate}%):</span>
                        <span>₹{gstDetails.sgstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {gstDetails.cgstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST ({gstDetails.cgstRate}%):</span>
                        <span>₹{gstDetails.cgstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rounding:</span>
                      <span>₹{gstDetails.roundingDifference.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment method selection */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      className={cn(
                        "flex items-center justify-center p-2 rounded-md text-xs border",
                        paymentMethod === 'cash' 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background hover:bg-muted"
                      )}
                      onClick={() => setPaymentMethod(paymentMethod === 'cash' ? '' : 'cash')}
                    >
                      Cash
                    </button>
                    <button
                      className={cn(
                        "flex items-center justify-center p-2 rounded-md text-xs border",
                        paymentMethod === 'card' 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background hover:bg-muted"
                      )}
                      onClick={() => setPaymentMethod(paymentMethod === 'card' ? '' : 'card')}
                    >
                      Card
                    </button>
                    <button
                      className={cn(
                        "flex items-center justify-center p-2 rounded-md text-xs border",
                        paymentMethod === 'upi' 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background hover:bg-muted"
                      )}
                      onClick={() => setPaymentMethod(paymentMethod === 'upi' ? '' : 'upi')}
                    >
                      UPI
                    </button>
                  </div>
                </div>

                {/* Cash amount input (only shown when cash is selected) */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Cash Amount Given</label>
                    <input
                      type="text"
                      placeholder="Enter Amount"
                      value={cashGiven}
                      onChange={(e) => {
                        // Only allow positive numbers
                        const value = e.target.value;
                        if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
                          setCashGiven(value);
                        }
                      }}
                      className="w-full h-8 text-sm px-2 border rounded-md"
                    />

                    {cashGiven && (
                      <div className="mt-1 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount to Pay:</span>
                          <span>₹{gstDetails.roundedAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cash Given:</span>
                          <span>₹{cashGivenNumber > 0 ? cashGivenNumber.toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Return Amount:</span>
                          <span>₹{changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons in a single row */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="justify-center py-3 text-sm h-auto"
                    onClick={handlePrintKOT}
                    disabled={orderItems.length === 0 || isSubmitting}
                    variant="outline"
                  >
                    Print KOT
                  </Button>
                  <Button
                    className="justify-center py-3 text-sm h-auto"
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0 || isSubmitting || !paymentMethod}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Place Order</span>
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
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-20 right-4 z-40 md:hidden"
        >
          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary font-medium">
                {totalItems}
              </span>
            </div>
          </Button>
        </motion.div>
      )}

    </div>
  );
};

// Export the memoized component
export const DashboardTakeaway = memo(DashboardTakeawayComponent);
