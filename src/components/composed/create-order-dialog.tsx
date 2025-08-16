import {memo, useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {
    ChevronDown,
    ChevronRight,
    Loader2,
    Menu as MenuIcon,
    Minus,
    Pencil,
    Plus,
    Search,
    ShoppingCart,
    X
} from 'lucide-react';
import {Dialog, DialogContent,} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {MenuItem, Order, OrderItem} from '@/types';
import {toast} from '@/lib/toast';
import {useAuthStore} from "@/lib/auth/auth.store";
import {cn, generateTokenNumber, debounce} from '@/lib/utils';
import {useCategories, useMenuItems} from "@/api/menu";
import {useCreateOrder, useUpdateOrder} from "@/api/orders";
import {useFavoriteItems} from "@/api/analytics";
import {usePrinterConfig} from "@/api/printers";
import {PermissionGuard} from './permission-guard';
import {PERMISSIONS} from '@/lib/auth/roles';
import { ensureQzConnected } from '@/lib/qz/ensureQz';


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

interface CreateOrderDialogProps {
    open: boolean;
    onClose: () => void;
    table_id?: number;
    onCreateOrder?: (items: OrderItem[]) => void;
    existingOrder?: Order | null;
    orderType?: 'dine-in' | 'takeaway' | 'quick-bill';
}

function CreateOrderDialogComponent({
                                        open,
                                        onClose,
                                        table_id,
                                        onCreateOrder,
                                        existingOrder,
                                        orderType: initialOrderType
                                    }: CreateOrderDialogProps) {
    // Data fetching with React Query
    const {data: menuItems = [], isLoading: menuItemsLoading} = useMenuItems();
    const {data: categories = [], isLoading: categoriesLoading} = useCategories();
    const {data: favoriteItems = [], isLoading: favoriteItemsLoading} = useFavoriteItems();
    const {data: printerConfig} = usePrinterConfig();
    const {user} = useAuthStore();

    // Mutations
    const createOrderMutation = useCreateOrder();
    const updateOrderMutation = useUpdateOrder();

    // Component State
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemNote, setItemNote] = useState<string>('');

    // Mobile UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [currentOrderType, setCurrentOrderType] = useState<'dine-in' | 'takeaway' | 'quick-bill'>(
        table_id ? 'dine-in' : initialOrderType || 'takeaway'
    );

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

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setOrderItems([]);
            setCurrentOrderType(table_id ? 'dine-in' : initialOrderType || 'takeaway');

        } else {
            setSearchQuery('');
            setSelectedCategory('all');
        }
    }, [open, existingOrder, table_id, initialOrderType]);

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

    // Filter items based on category and search
    const filteredItems = useMemo(() => {
        let items = menuItems;
        if (selectedCategory === 'favourites') {
            const favoriteItemIds = favoriteItems.map(item => item.menu_item_id);
            items = menuItems.filter(item => favoriteItemIds.includes(item.id));
        } else if (selectedCategory !== 'all') {
            const catId = parseInt(selectedCategory);
            const childIds = subCategoriesByParent[catId]?.map(c => c.id) || [];
            const ids = new Set([catId, ...childIds]);
            items = menuItems.filter(item => ids.has(item.category_id));
        }
        
        return searchQuery ? 
            items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : 
            items;
    }, [menuItems, selectedCategory, searchQuery, favoriteItems, subCategoriesByParent]);

    // Handle quantity changes
    const handleQuantityChange = useCallback((item: MenuItem, delta: number) => {
        // Don't allow adding unavailable items
        if (!item.available && delta > 0) {
            toast.error("This item is currently unavailable");
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
                    order_id: existingOrder?.id || 0,
                    menu_item_id: item.id,
                    quantity: 1,
                    notes: '',
                    include_in_gst: item.include_in_gst,
                    price: item.price,
                    name: item.name,
                    status: 'placed'
                }];
            }
            return current;
        });
    }, [existingOrder]);

    // Handle cart quantity changes
    const handleCartQuantityChange = useCallback((menuItemId: number, delta: number) => {
        setOrderItems(current => {
            const existingItem = current.find(i => i.menu_item_id === menuItemId);
            if (!existingItem) return current;
            
            const newQuantity = existingItem.quantity + delta;
            if (newQuantity <= 0) {
                return current.filter(i => i.menu_item_id !== menuItemId);
            }
            return current.map(i =>
                i.menu_item_id === menuItemId ? {...i, quantity: newQuantity} : i
            );
        });
    }, []);

    // Handle note editing
    const handleEditNote = useCallback((itemId: number, currentNote: string) => {
        setEditingItemId(itemId);
        setItemNote(currentNote);
    }, []);

    // Save note
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

    // Get item quantity
    const getItemQuantity = useCallback((itemId: number) => {
        return orderItems.find(item => item.menu_item_id === itemId)?.quantity || 0;
    }, [orderItems]);

    // Function to generate ESC/POS content for KOT
    const generateKOTContent = (tokenNumber: string): string => {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN');
        const timeFormatted = now.toLocaleTimeString('en-IN');
        const orderTypeText = table_id ? 'Dine-in' : currentOrderType.charAt(0).toUpperCase() + currentOrderType.slice(1);

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
        receipt += padString(`KOT No: ${tokenNumber.slice(-6)}`, 16) + padString(`Type: ${orderTypeText}`, 16);
        receipt += ESCPOS.LF;
        receipt += padString(`Table: ${table_id || 'N/A'}`, 16) + padString(`Server: ${user?.name || 'N/A'}`, 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;

        // Token number for takeaway/quick-bill
        if (!table_id) {
            receipt += ESCPOS.ALIGN_CENTER;
            receipt += ESCPOS.BOLD_ON;
            receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
            receipt += `TOKEN NO: ${tokenNumber}`;
            receipt += ESCPOS.LF;
            receipt += ESCPOS.FONT_SIZE_NORMAL;
            receipt += ESCPOS.BOLD_OFF;
            receipt += ESCPOS.ALIGN_LEFT;
        }

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
            const itemNameLines = wrapText(item.name, 20);
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

    // Function to print KOT (Kitchen Order Ticket)
    const handlePrintKOT = useCallback(async (tokenNumber: string) => {
        // Check if we have items to print
        if (orderItems.length === 0) {
            console.warn('No items to print for KOT');
            return;
        }

        try {
            // Print KOT using QZ Tray
            try {
                await ensureQzConnected();

                // Get KOT printers from configuration
                const kotPrinters = printerConfig?.kot_printers || [];
                // if (kotPrinters.length === 0) {
                //     throw new Error('No KOT printers configured. Please configure printers in settings.');
                // }

                // Generate ESC/POS receipt content
                const kotContent = generateKOTContent(tokenNumber);

                // Print to all configured KOT printers
                for (const printer of kotPrinters) {
                    const config = window.qz.configs.create(printer);
                    // Convert string to bytes for raw printing
                    const data = [kotContent];
                    await window.qz.print(config, data);
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to print KOT';
                console.error('Print error:', error);
                // Show error but continue execution
                toast.error(errorMessage);
            }
        } catch (err) {
            console.error('KOT error:', err);
            // Show error but continue execution
            toast.error('Failed to generate KOT');
        }
    }, [orderItems, user, table_id, currentOrderType, printerConfig]);

    // Create a ref to store the debounced function
    const debouncedPrintKOTRef = useRef<any>(null);
    
    // Create a debounced version of handlePrintKOT
    useEffect(() => {
        // Create a new debounced function when dependencies change
        debouncedPrintKOTRef.current = debounce(handlePrintKOT, 500); // 500ms debounce time
    }, [handlePrintKOT]);

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

    // Submit order
    const handleSubmitOrder = useCallback(async () => {
        setIsSubmitting(true);
        
        try {
            const tokenNumber = generateTokenNumber();
            const orderData = {
                table_id: table_id,
                staff_id: user?.staff_id,
                status: 'placed' as const,
                order_type: table_id ? 'dine-in' : currentOrderType,
                items: orderItems.map(({  ...rest }) => rest), // Remove temp ID
                total_amount: totalAmount
            };

            if (existingOrder) {
                            const existingItemsMap = new Map(existingOrder.items.map(item => [item.menu_item_id, { ...item }]));

                            orderData.items.forEach(newItem => {
                                if (existingItemsMap.has(newItem.menu_item_id)) {
                                    const existingItem = existingItemsMap.get(newItem.menu_item_id)!;
                                    existingItem.quantity += newItem.quantity;
                                    if (newItem.notes) {
                                        existingItem.notes = existingItem.notes ? `${existingItem.notes}; ${newItem.notes}` : newItem.notes;
                                    }
                                } else {
                                    existingItemsMap.set(newItem.menu_item_id, newItem);
                                }
                            });

                            const updatedItems = Array.from(existingItemsMap.values());

                            await updateOrderMutation.mutateAsync({
                                id: existingOrder.id,
                                order: { items: updatedItems } as any
                            });
                            toast.success(`Order for ${table_id ? `Table ${table_id}` : currentOrderType} updated.`);
                            onClose();
                            // Print KOT for new items (fire-and-forget)
                            if (orderItems.length > 0) {
                                handlePrintKOT(existingOrder.token_number || tokenNumber).catch(err => console.error('KOT print error:', err));
                            }
                        }else {
                await createOrderMutation.mutateAsync(orderData as any);
                toast.success(`Order created successfully.`);
                onClose();

                
                // Print KOT for new order (fire-and-forget)
                handlePrintKOT(tokenNumber).catch(err => console.error('KOT print error:', err));
            }

            // Pass the updated items to parent if callback provided
            if (onCreateOrder) {
                onCreateOrder(orderItems);
            }
            
            // Reset local state
            setOrderItems([]);
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
            toast.error(`Order failed: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        orderItems,
        table_id,
        user,
        totalAmount,
        existingOrder,
        currentOrderType,
        updateOrderMutation,
        createOrderMutation,
        onCreateOrder,
        onClose,
        handlePrintKOT
    ]);
    
    // Create a debounced version of handleSubmitOrder
    const debouncedSubmitOrder = useCallback(debounce(handleSubmitOrder, 500), [handleSubmitOrder]);

    const isLoading = menuItemsLoading || categoriesLoading || favoriteItemsLoading;

    return (
        <Dialog open={open}>
            <DialogContent
                onClose={!isSubmitting ? onClose : undefined}
                className="h-[90dvh] max-h-[90dvh] max-w-[90vw] md:max-w-[90vw] lg:max-w-[80vw] p-0 sm:p-2 overflow-hidden">
                <div className="flex h-full flex-col overflow-hidden">
                    {/* Mobile header with toggle button and centered text */}
                    <div className="flex items-center md:hidden p-2 border-b shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="absolute left-2"
                        >
                            <MenuIcon className="h-5 w-5"/>
                        </Button>
                        <h2 className="text-lg font-semibold flex-1 text-center">{table_id ? `Table ${table_id}` : `${currentOrderType.charAt(0).toUpperCase() + currentOrderType.slice(1)} Order`}</h2>
                        <div className="w-10"></div>
                        {/* Spacer to help with centering */}
                    </div>

                    {/* Order Type Selection - Only show if no table is selected */}
                    {!table_id && (
                        <div className="p-3 border-b shrink-0">
                            <h3 className="text-sm font-semibold mb-2">Order Type</h3>
                            <div className="flex flex-wrap gap-2">
                                <label
                                    className={`flex items-center p-2 rounded-md border cursor-pointer ${currentOrderType === 'takeaway' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                                    <input
                                        type="radio"
                                        name="order-type"
                                        value="takeaway"
                                        checked={currentOrderType === 'takeaway'}
                                        onChange={() => setCurrentOrderType('takeaway')}
                                        className="mr-2"
                                    />
                                    Takeaway
                                </label>
                                <label
                                    className={`flex items-center p-2 rounded-md border cursor-pointer ${currentOrderType === 'quick-bill' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                                    <input
                                        type="radio"
                                        name="order-type"
                                        value="quick-bill"
                                        checked={currentOrderType === 'quick-bill'}
                                        onChange={() => setCurrentOrderType('quick-bill')}
                                        className="mr-2"
                                    />
                                    Quick Bill
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                        {/* Categories Sidebar - Collapsible on mobile */}
                        <div className={cn(
                            "border-b bg-muted p-2 md:w-48 md:border-b-0 md:border-r dark:border-border overflow-y-auto custom-scrollbar",
                            "md:relative md:block", // Always visible on desktop
                            isSidebarOpen ? "block" : "hidden", // Toggle on mobile
                            "max-h-[50vh] md:max-h-none shrink-0" // Limit height on mobile
                        )}>
                            <div className="flex items-center justify-between mb-2 md:hidden">
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
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All Items
                                </button>
                                {/*<button*/}
                                {/*    className={cn(*/}
                                {/*        "w-full rounded-md p-2 text-left text-sm flex items-center",*/}
                                {/*        selectedCategory === 'favourites'*/}
                                {/*            ? 'bg-primary text-primary-foreground'*/}
                                {/*            : 'hover:bg-accent hover:text-accent-foreground'*/}
                                {/*    )}*/}
                                {/*    onClick={() => setSelectedCategory('favourites')}*/}
                                {/*>*/}
                                {/*    <Star className="h-4 w-4 mr-2"/>*/}
                                {/*    Favourites*/}
                                {/*    {favoriteItemsLoading && (*/}
                                {/*        <Loader2 className="h-3 w-3 ml-2 animate-spin"/>*/}
                                {/*    )}*/}
                                {/*</button>*/}
                            </div>
                            <div className="flex flex-col gap-1">
                                {/* Main Categories with Expandable Subcategories */}
                                {mainCategories.map(category => (
                                    <div key={category.id}>
                                        <div className="flex items-center w-full">
                                            {subCategoriesByParent[category.id] && <button onClick={() => toggleCategory(category.id)} className="p-1">{expandedCategories[category.id] ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}</button>}
                                            <button className={cn("flex-1 rounded-md p-2 text-left text-sm", selectedCategory === String(category.id) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} onClick={() => setSelectedCategory(String(category.id))}>{category.name}</button>
                                        </div>
                                        {expandedCategories[category.id] && subCategoriesByParent[category.id] && <div className="ml-5 mt-1 pl-1 border-l-2">{subCategoriesByParent[category.id].map(sub => <button key={sub.id} className={cn("w-full rounded-md p-2 text-left text-sm", selectedCategory === String(sub.id) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} onClick={() => setSelectedCategory(String(sub.id))}>{sub.name}</button>)}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items and Order Summary */}
                        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                            {/* Menu Items Section */}
                            <div className={cn(
                                "flex-1 flex flex-col overflow-hidden",
                                isCartOpen ? "hidden md:flex" : "flex"
                            )}>
                                <div className="sticky top-0 z-10 bg-background p-2 xs:p-3 sm:p-3 shrink-0">
                                    <div className="relative">
                                        <Search
                                            className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                        <Input
                                            type="text"
                                            placeholder="Search by name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-3 pt-0 custom-scrollbar">
                                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 auto-rows-max">
                                        {isLoading ? (
                                            <div className="col-span-full flex justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                            </div>
                                        ) : filteredItems.length > 0 ? filteredItems.map(item => (
                                            <div
                                                key={item.id}
                                                className={`relative p-2 rounded-md border bg-card ${item.available ? 'cursor-pointer hover:bg-accent/50' : 'cursor-not-allowed opacity-75'} transition-colors`}
                                                onClick={() => item.available && handleQuantityChange(item, 1)}
                                            >
                                                {!item.available && (
                                                    <div className="absolute -top-1 -right-1 z-10">
                                                        <div
                                                            className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                                            Unavailable
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium leading-tight text-sm line-clamp-2">{item.name}</h3>
                                                    <div className="mt-1 flex items-center justify-between">
                                                        <span
                                                            className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                                                        {getItemQuantity(item.id) > 0 && (
                                                            <span
                                                                className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                                                                Qty: {getItemQuantity(item.id)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div
                                                className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                                                <Search className="h-10 w-10 text-muted-foreground mb-3"/>
                                                <p className="text-muted-foreground">No menu items found</p>
                                                <p className="text-xs text-muted-foreground mt-1">Try adjusting your
                                                    search or category</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary Section - Collapsible on mobile */}
                            <div className={cn(
                                "border-t bg-muted md:w-72 md:border-l md:border-t-0 flex flex-col dark:border-border overflow-hidden",
                                "md:relative md:flex", // Changed block to flex for consistency
                                isCartOpen ? "fixed inset-0 z-50 bg-background" : "hidden", // Toggle on mobile
                                "md:static md:z-auto shrink-0" // Reset on desktop
                            )}>
                                <div className="flex flex-col h-full overflow-hidden">
                                    {/* Mobile close button */}
                                    <div className="flex items-center justify-between p-0.5 md:hidden shrink-0">
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
                                                <p className="text-xs text-muted-foreground mt-1">Add items from the
                                                    menu to get started</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {orderItems.map(item => (
                                                    <div key={item.id} className="flex flex-col gap-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                                </p>
                                                                {item.notes && editingItemId !== item.id && (
                                                                    <p className="text-xs italic text-muted-foreground mt-1">
                                                                        Note: {item.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                                                                    <button
                                                                        className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                                                                        onClick={() => handleCartQuantityChange(item.menu_item_id, -1)}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Minus className="h-3 w-3"/>
                                                                    </button>
                                                                    <span
                                                                        className="w-5 text-center text-sm">{item.quantity}</span>
                                                                    <button
                                                                        className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                                                                        onClick={() => handleCartQuantityChange(item.menu_item_id, 1)}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Plus className="h-3 w-3"/>
                                                                    </button>
                                                                    <button
                                                                        className="border rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent ml-1"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditNote(item.id, item.notes || '');
                                                                        }}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Pencil className="h-3 w-3"/>
                                                                    </button>
                                                                </PermissionGuard>
                                                            </div>
                                                        </div>

                                                        {editingItemId === item.id && (
                                                            <div className="mt-1 flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    value={itemNote}
                                                                    onChange={(e) => setItemNote(e.target.value)}
                                                                    placeholder="Add note for this item..."
                                                                    className="flex-1 h-8 px-2 text-sm"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleSaveNote();
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    onClick={handleSaveNote}
                                                                    className="h-8 px-2"
                                                                >
                                                                    Save
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 border-t mt-auto bg-muted dark:border-border shrink-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">Total Amount</span>
                                                <span
                                                    className="text-lg font-semibold text-primary">₹{totalAmount.toFixed(2)}</span>
                                            </div>
                                            <PermissionGuard permission={PERMISSIONS.CREATE_ORDER}>
                                                <Button
                                                    className="w-full justify-between py-4 text-base"
                                                    onClick={debouncedSubmitOrder}
                                                    disabled={orderItems.length === 0}
                                                    loading={isSubmitting}
                                                    loadingText="Processing..."
                                                >
                                                    <span>{existingOrder ? 'Update Order' : 'Place Order'}</span>
                                                    {!isSubmitting && <ChevronRight className="h-5 w-5"/>}
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating cart button on mobile */}
                    {!isCartOpen && orderItems.length > 0 && (
                        <Button
                            className="fixed right-4 h-14 w-14 rounded-full shadow-lg md:hidden bottom-[calc(1rem+env(safe-area-inset-bottom))]"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <div className="relative">
                                <ShoppingCart className="h-6 w-6"/>
                                <span
                                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary">
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

// Export the component wrapped with memo to prevent unnecessary rerenders
export const CreateOrderDialog = memo(CreateOrderDialogComponent);

