import {memo, useCallback, useEffect, useMemo, useState, useRef} from 'react';
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
import {useMenuStore, useOrderStore, usePaymentStore, useRestaurantStore, usePrinterStore} from '@/lib/store';
import {MenuItem, Order, OrderItem} from '@/types';
import {cn, debounce} from '@/lib/utils';
import {useAuthStore} from "@/lib/store/auth.store";
import {useOrder} from '@/lib/hooks/useOrder';
import {orderService} from "@/lib/api/services";
import {toast} from '@/lib/toast';
import {Card} from '@/components/ui/card';
import {motion} from 'framer-motion';
import {analyticsService} from '@/lib/api/services/analytics.service';
import {MenuItemAnalytics} from '@/types/analytics';

// ESC/POS command constants
const ESC = '\x1b';
const GS = '\x1d';

// ESC/POS Commands
const ESCPOS = {
    // Initialize printer
    INIT: ESC + '@',
    // Text formatting
    BOLD_ON: ESC + 'E' + '\x01',
    BOLD_OFF: ESC + 'E' + '\x00',
    UNDERLINE_ON: ESC + '-' + '\x01',
    UNDERLINE_OFF: ESC + '-' + '\x00',
    // Text alignment
    ALIGN_LEFT: ESC + 'a' + '\x00',
    ALIGN_CENTER: ESC + 'a' + '\x01',
    ALIGN_RIGHT: ESC + 'a' + '\x02',
    // Font sizes
    FONT_SIZE_NORMAL: GS + '!' + '\x00',
    FONT_SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01',
    FONT_SIZE_DOUBLE_WIDTH: GS + '!' + '\x10',
    FONT_SIZE_DOUBLE: GS + '!' + '\x11',
    // Line feeds
    LF: '\n',
    CR: '\r',
    CRLF: '\r\n',
    // Paper cutting
    CUT_PAPER: GS + 'V' + '\x41' + '\x03',
    // Drawer kick
    DRAWER_KICK: ESC + 'p' + '\x00' + '\x19' + '\xfa',
};

// Helper function to pad string to specific width
const padString = (str: string, width: number, padChar: string = ' '): string => {
    if (str.length >= width) return str.substring(0, width);
    return str + padChar.repeat(width - str.length);
};

// Helper function to create a line separator
const createSeparatorLine = (char: string = '-', width: number = 32): string => {
    return char.repeat(width);
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
};

// Helper function to split long text into multiple lines
const wrapText = (text: string, maxWidth: number): string[] => {
    if (text.length <= maxWidth) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxWidth) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // Word is longer than max width, force break it
                lines.push(word.substring(0, maxWidth));
                currentLine = word.substring(maxWidth);
            }
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};

interface DashboardTakeawayProps {
    /** Optional callback when an order is created */
    onOrderCreated?: () => void;
    type: string
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
    const {menuItems, categories} = useMenuStore();
    const {calculateOrderTotals} = useOrderStore();
    const {user} = useAuthStore();
    const {addPayment} = usePaymentStore();
    const {updateOrderStatus} = useOrder();
    const {restaurant} = useRestaurantStore();

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
                    i.menu_item_id === item.id ? {...i, quantity: newQuantity} : i
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
                        ? {...item, notes: itemNote}
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
        const {subTotal, sgstAmount, cgstAmount, totalAmount: calculatedTotal} = calculateOrderTotals(
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

    // Function to generate ESC/POS receipt content
    const generateReceiptContent = (order: Order): string => {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN');
        const timeFormatted = now.toLocaleTimeString('en-IN');
        const orderType = order.order_type === 'takeaway' ? 'Takeaway' :
            order.order_type === 'quick-bill' ? 'Quick Bill' : 'Dine-in';

        let receipt = '';

        // Initialize printer
        receipt += ESCPOS.INIT;

        // Header with restaurant name
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += ESCPOS.FONT_SIZE_DOUBLE;
        receipt += ESCPOS.BOLD_ON;
        receipt += (restaurant?.name || 'Restaurant Name').toUpperCase();
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;

        // Restaurant details
        const restaurantAddress = restaurant?.address || 'Restaurant Address';
        const addressLines = wrapText(restaurantAddress, 32);
        addressLines.forEach(line => {
            receipt += line;
            receipt += ESCPOS.LF;
        });

        receipt += `Phone: ${restaurant?.phone || 'Phone Number'}`;
        receipt += ESCPOS.LF;
        receipt += `GST No: ${restaurant?.gst_number || 'GST Number'}`;
        receipt += ESCPOS.LF;

        // Separator
        receipt += ESCPOS.ALIGN_LEFT;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // Bill information
        receipt += ESCPOS.BOLD_ON;
        receipt += padString(`Bill No: ${order.id}`, 16) + padString(`Date: ${dateFormatted}`, 16);
        receipt += ESCPOS.LF;
        receipt += padString(`Time: ${timeFormatted}`, 16) + padString(`Type: ${orderType}`, 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;

        // Table info for dine-in orders
        if (order.order_type === 'dine-in') {
            receipt += padString(`Table: ${order.table_id || 'N/A'}`, 16);
            receipt += padString(`Server: ${order.server || 'N/A'}`, 16);
            receipt += ESCPOS.LF;
        }

        // Token number if available
        if (order.token_number) {
            receipt += ESCPOS.ALIGN_CENTER;
            receipt += ESCPOS.BOLD_ON;
            receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
            receipt += `TOKEN NO: ${order.token_number}`;
            receipt += ESCPOS.LF;
            receipt += ESCPOS.FONT_SIZE_NORMAL;
            receipt += ESCPOS.BOLD_OFF;
            receipt += ESCPOS.ALIGN_LEFT;
        }

        // Separator
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // Items header
        receipt += ESCPOS.BOLD_ON;
        receipt += padString('Item', 16) + padString('Qty', 4) + padString('Rate', 6) + padString('Amount', 6);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Order items
        const orderItems = order.items || [];
        orderItems
            .filter(item => item.status !== 'cancelled')
            .forEach(item => {
                // Item name (wrap if too long)
                const itemNameLines = wrapText(item.name, 32);
                itemNameLines.forEach((line, index) => {
                    if (index === 0) {
                        // First line with quantity, rate, and amount
                        receipt += padString(line, 16) +
                            padString(item.quantity.toString(), 4) +
                            padString(formatCurrency(item.price), 6) +
                            padString(formatCurrency(item.quantity * item.price), 6);
                    } else {
                        // Continuation lines
                        receipt += line;
                    }
                    receipt += ESCPOS.LF;
                });
            });

        // Separator
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Totals section
        const subTotal = order.sub_total || 0;
        const sgstAmount = order.sgst_amount || 0;
        const cgstAmount = order.cgst_amount || 0;
        const sgstRate = order.sgst_rate || 0;
        const cgstRate = order.cgst_rate || 0;

        const totalAmount = order.total_amount || 0;
        const roundedAmount = Math.ceil(totalAmount);
        const roundingDifference = roundedAmount - totalAmount;

        // Subtotal
        receipt += padString('Subtotal:', 24) + padString(formatCurrency(subTotal), 8);
        receipt += ESCPOS.LF;

        // GST details
        if (sgstAmount > 0) {
            receipt += padString(`SGST (${sgstRate}%):`, 24) + padString(formatCurrency(sgstAmount), 8);
            receipt += ESCPOS.LF;
        }

        if (cgstAmount > 0) {
            receipt += padString(`CGST (${cgstRate}%):`, 24) + padString(formatCurrency(cgstAmount), 8);
            receipt += ESCPOS.LF;
        }

        // Rounding adjustment
        receipt += padString('Rounding Adj:', 24) + padString(formatCurrency(roundingDifference), 8);
        receipt += ESCPOS.LF;

        // Total amount
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_ON;
        receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
        receipt += padString('TOTAL:', 16) + padString(formatCurrency(roundedAmount), 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;
        receipt += ESCPOS.BOLD_OFF;

        // Payment method
        if (paymentMethod) {
            receipt += createSeparatorLine('-', 32);
            receipt += ESCPOS.LF;
            receipt += padString('Payment Method:', 24) + padString(paymentMethod.replace('_', ' ').toUpperCase(), 8);
            receipt += ESCPOS.LF;

            // Cash payment details
            if (paymentMethod === 'cash' && cashGiven) {
                const cashGivenNumber = parseFloat(cashGiven);
                const changeAmount = cashGivenNumber > roundedAmount ? cashGivenNumber - roundedAmount : 0;

                receipt += padString('Cash Given:', 24) + padString(formatCurrency(cashGivenNumber), 8);
                receipt += ESCPOS.LF;
                receipt += padString('Change:', 24) + padString(formatCurrency(changeAmount), 8);
                receipt += ESCPOS.LF;
            }
        }

        // Footer
        receipt += ESCPOS.LF;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += 'Thank you for your visit!';
        receipt += ESCPOS.LF;
        receipt += 'Please visit again';
        receipt += ESCPOS.LF;
        receipt += ESCPOS.LF;

        // Cut paper
        receipt += ESCPOS.CUT_PAPER;

        return receipt;
    };

    // Get printer configuration from store
    const { printerConfig } = usePrinterStore();

    // Function to print bill using QZ Tray
    const handlePrintBill = useCallback(async (order: Order) => {
        try {
            // Check if QZ Tray is available
            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available. Please ensure QZ Tray is installed and running.');
            }

            // Connect to QZ Tray if not already connected
            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            // Get bill printers from configuration
            const billPrinters = printerConfig?.bill_printers || [];
            if (billPrinters.length === 0) {
                throw new Error('No bill printers configured. Please configure printers in settings.');
            }

            // Generate ESC/POS receipt content
            const receiptContent = generateReceiptContent(order);

            // Print to all configured bill printers
            for (const printer of billPrinters) {
                const config = window.qz.configs.create(printer);
                // Convert string to bytes for raw printing
                const data = [receiptContent];
                await window.qz.print(config, data);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to print bill';
            toast.error(errorMessage);
            console.error('Print error:', error);
            
        }
    }, [restaurant, paymentMethod, cashGiven, printerConfig]);
    

    // Function to generate ESC/POS content for KOT
    const generateKOTContent = (tokenNumber: string): string => {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN');
        const timeFormatted = now.toLocaleTimeString('en-IN');

        let receipt = '';

        // Initialize printer
        receipt += ESCPOS.INIT;

        // Header with KOT title
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += ESCPOS.FONT_SIZE_DOUBLE;
        receipt += ESCPOS.BOLD_ON;
        receipt += 'KITCHEN ORDER TICKET';
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;
        receipt += `Date: ${dateFormatted} Time: ${timeFormatted}`;
        receipt += ESCPOS.LF;

        // Separator
        receipt += ESCPOS.ALIGN_LEFT;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // KOT information
        receipt += ESCPOS.BOLD_ON;
        receipt += padString(`KOT No: ${tokenNumber.slice(-6)}`, 16) + padString(`Type: ${type}`, 16);
        receipt += ESCPOS.LF;
        receipt += padString(`Table: Takeaway`, 16) + padString(`Server: ${user?.name || 'N/A'}`, 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;

        // Separator
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Items header
        receipt += ESCPOS.BOLD_ON;
        receipt += padString('Item', 20) + padString('Qty', 4) + padString('Notes', 8);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Order items
        orderItems.forEach(item => {
            // Item name (wrap if too long)
            const itemNameLines = wrapText(item.name || 'Unknown Item', 20);
            itemNameLines.forEach((line, index) => {
                if (index === 0) {
                    // First line with quantity and notes
                    receipt += padString(line, 20) +
                        padString(item.quantity.toString(), 4) +
                        padString(item.notes || '-', 8);
                } else {
                    // Continuation lines
                    receipt += line;
                }
                receipt += ESCPOS.LF;
            });
        });

        // Footer
        receipt += ESCPOS.LF;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += '*** Kitchen Copy ***';
        receipt += ESCPOS.LF;
        receipt += ESCPOS.LF;

        // Cut paper
        receipt += ESCPOS.CUT_PAPER;

        return receipt;
    };

    // Create a ref to store the debounced function
    const debouncedPrintKOTRef = useRef<any>(null);
    
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

            // Generate a token number for the order
            const tokenNumber = `${type.charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`;

            // Print KOT using QZ Tray
            try {
                // Check if QZ Tray is available
                if (typeof window.qz === 'undefined') {
                    throw new Error('QZ Tray not available. Please ensure QZ Tray is installed and running.');
                }

                // Connect to QZ Tray if not already connected
                if (!window.qz.websocket.isActive()) {
                    await window.qz.websocket.connect();
                }

                // Get KOT printers from configuration
                const kotPrinters = printerConfig?.kot_printers || [];
                if (kotPrinters.length === 0) {
                    throw new Error('No KOT printers configured. Please configure printers in settings.');
                }

                // Generate ESC/POS receipt content
                const kotContent = generateKOTContent(tokenNumber);

                // Print to all configured KOT printers
                for (const printer of kotPrinters) {
                    const config = window.qz.configs.create(printer);
                    // Convert string to bytes for raw printing
                    const data = [kotContent];
                    await window.qz.print(config, data);
                }

                toast.success('KOT printed successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to print KOT';
                toast.error(errorMessage);
                console.error('Print error:', error);
            }

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
    }, [orderItems, user, type, paymentMethod, gstDetails, setError, setIsSubmitting, user?.staff_id, addPayment, updateOrderStatus, handlePrintBill, onOrderCreated, printerConfig]);
    
    // Create a debounced version of handlePrintKOT
    useEffect(() => {
        // Create a new debounced function when dependencies change
        debouncedPrintKOTRef.current = debounce(handlePrintKOT, 500); // 500ms debounce time
    }, [handlePrintKOT]);
    
    // Function to call the debounced version
    const debouncedHandlePrintKOT = useCallback(() => {
        if (debouncedPrintKOTRef.current) {
            debouncedPrintKOTRef.current();
        }
    }, []);

    // Create a ref to store the debounced place order function
    const debouncedPlaceOrderRef = useRef<any>(null);
    
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

            // Print KOT slip before creating the order
            try {
                // Print KOT automatically
                handlePrintKOT();
                toast.success('KOT printed successfully');
            } catch (printError) {
                // Log the error but continue with order creation
                console.error('KOT printing error:', printError);
                toast.error('Failed to print KOT, but order will still be created');
            }

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
            try {
                handlePrintBill(createdOrder);
                toast.success('Bill printed successfully');
            } catch (printError) {
                // Log the error but continue with order processing
                console.error('Bill printing error:', printError);
                toast.error('Failed to print bill, but order was created successfully');
            }

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
    }, [orderItems, user?.staff_id, type, paymentMethod, gstDetails, cashGiven, addPayment, updateOrderStatus, onOrderCreated, handlePrintBill, setError, setIsSubmitting, setOrderItems, setSearchQuery, setSelectedCategory, setIsCartOpen, setCashGiven, setPaymentMethod]);
    
    // Create a debounced version of handlePlaceOrder
    useEffect(() => {
        // Create a new debounced function when dependencies change
        debouncedPlaceOrderRef.current = debounce(handlePlaceOrder, 500); // 500ms debounce time
    }, [handlePlaceOrder]);
    
    // Function to call the debounced version
    const debouncedHandlePlaceOrder = useCallback(() => {
        if (debouncedPlaceOrderRef.current) {
            debouncedPlaceOrderRef.current();
        }
    }, []);

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-1">
            {/* Mobile header with centered text */}
            <div
                className="flex items-center md:hidden p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 absolute left-2"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <MenuIcon className="h-4 w-4"/>
                </Button>
                <h2 className="text-base font-semibold flex-1 text-center">{type === 'quick-bill' ? 'Quick Bill' : 'Takeaway Order'}</h2>
                <div className="w-8"></div>
                {/* Spacer to balance the header */}
            </div>

            {/* Error message if any */}
            {error && (
                <div className="mx-3 mb-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 flex-shrink-0"/>
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
                        <X className="h-5 w-5"/>
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
                        <Star className="h-4 w-4 mr-2"/>
                        Favourites
                        {isLoadingFavourites && (
                            <Loader2 className="h-3 w-3 ml-2 animate-spin"/>
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
                                            <ChevronDown className="h-3 w-3 transition-transform"/>
                                        ) : (
                                            <ChevronRight className="h-3 w-3 transition-transform"/>
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
                                <MenuIcon className="h-4 w-4 mr-2"/>
                                Categories
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
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
                                        <div className="min-w-0">
                                            <h3 className="font-medium leading-tight text-sm line-clamp-2">{item.name}</h3>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                                                {getItemQuantity(item.id) > 0 && (
                                                    <span
                                                        className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                            Qty: {getItemQuantity(item.id)}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <div
                                    className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                                    <Search className="h-10 w-10 text-muted-foreground mb-3"/>
                                    <p className="text-muted-foreground">No menu items found</p>
                                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or
                                        category</p>
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
                        <div
                            className="flex items-center justify-between p-3 md:hidden shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b">
                            <h2 className="text-base font-semibold">Your Order</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsCartOpen(false)}
                            >
                                <X className="h-5 w-5"/>
                            </Button>
                        </div>

                        <div className="p-3 md:block hidden shrink-0">
                            <h2 className="text-base font-semibold">Order Summary</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                            {orderItems.length === 0 ? (
                                <div
                                    className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
                                    <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2"/>
                                    <p className="text-sm text-muted-foreground">Your order is empty</p>
                                    <p className="text-xs text-muted-foreground mt-1">Add items from the menu to get
                                        started</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {orderItems.map(item => (
                                        <div key={item.id}
                                             className="flex flex-col gap-2 p-2 rounded-lg border border-primary/10 bg-card">
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
                                                        onClick={() => handleQuantityChange({
                                                            id: item.menu_item_id,
                                                            price: item.price,
                                                            name: item.name
                                                        } as MenuItem, -1)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Minus className="h-3 w-3"/>
                                                    </button>
                                                    <span
                                                        className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        className="border rounded-md h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                                                        onClick={() => handleQuantityChange({
                                                            id: item.menu_item_id,
                                                            price: item.price,
                                                            name: item.name
                                                        } as MenuItem, 1)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Plus className="h-3 w-3"/>
                                                    </button>
                                                    <button
                                                        className="border rounded-md h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent ml-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditNote(item.id, item.notes);
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Pencil className="h-3 w-3"/>
                                                    </button>
                                                </div>
                                            </div>

                                            {editingItemId === item.id && (
                                                <motion.div
                                                    className="mt-1 flex gap-2"
                                                    initial={{opacity: 0, height: 0}}
                                                    animate={{opacity: 1, height: 'auto'}}
                                                    exit={{opacity: 0, height: 0}}
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
                                            <Info className="h-4 w-4"/>
                                        </button>
                                        <span
                                            className="text-lg font-semibold text-primary">₹{gstDetails.roundedAmount.toFixed(2)}</span>
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
                                                <span
                                                    className="text-muted-foreground">SGST ({gstDetails.sgstRate}%):</span>
                                                <span>₹{gstDetails.sgstAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {gstDetails.cgstAmount > 0 && (
                                            <div className="flex justify-between">
                                                <span
                                                    className="text-muted-foreground">CGST ({gstDetails.cgstRate}%):</span>
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
                                <div className="grid grid-cols-1 gap-2">
                                    <Button
                                        className="justify-center py-3 text-sm h-auto"
                                        onClick={debouncedHandlePlaceOrder}
                                        disabled={orderItems.length === 0 || isSubmitting || !paymentMethod}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
                    initial={{scale: 0, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    exit={{scale: 0, opacity: 0}}
                    className="fixed bottom-20 right-4 z-40 md:hidden"
                >
                    <Button
                        className="h-14 w-14 rounded-full shadow-lg"
                        onClick={() => setIsCartOpen(true)}
                    >
                        <div className="relative">
                            <ShoppingCart className="h-6 w-6"/>
                            <span
                                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary font-medium">
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
