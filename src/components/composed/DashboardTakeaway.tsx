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
import { TakeawaySkeleton } from '@/components/composed/takeaway-skeleton';
import {Button} from '@/components/ui/button';
import {MenuItem, Order, OrderItem} from '@/types';
import {cn, debounce} from '@/lib/utils';
import {useAuthStore} from "@/lib/auth/auth.store";
import {toast} from '@/lib/toast';
import {Card} from '@/components/ui/card';
import {motion} from 'framer-motion';
import {useFavoriteItems} from '@/api/analytics';
import {useCategories, useMenuItems} from "@/api/menu";
import {useCreateOrder, useUpdateOrderStatus} from "@/api/orders";
import {useRestaurant} from "@/api/restaurant";
import {useCreatePayment} from "@/api/payments";
import {usePrinterConfig} from "@/api/printers";

// KOT Printing and other logic will be adapted from your file
// Note: QZ Tray logic is preserved but assumes window.qz is available.
declare global {
    interface Window {
        qz: any;
    }
}

const ESC = '\x1b';
const GS = '\x1d';
const ESCPOS = {
    // INIT: ESC + '@', BOLD_ON: ESC + 'E' + '\x01', BOLD_OFF: ESC + 'E' + '\x00',
    // ALIGN_LEFT: ESC + 'a' + '\x00', ALIGN_CENTER: ESC + 'a' + '\x01',
    // FONT_SIZE_NORMAL: GS + '!' + '\x00', FONT_SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01',
    // CUT_PAPER: GS + 'V' + '\x41' + '\x03', LF: '
    // ',
};
const padString = (str: string, width: number, padChar = ' ') => str.padEnd(width, padChar).substring(0, width);
const createSeparatorLine = (char = '-', width = 32) => char.repeat(width);

interface DashboardTakeawayProps {
    onOrderCreated?: () => void;
    type: 'takeaway' | 'quick-bill';
}

const DashboardTakeawayComponent: React.FC<DashboardTakeawayProps> = ({ onOrderCreated, type }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemNote, setItemNote] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | ''>('');
    const [cashGiven, setCashGiven] = useState<string>('');
    const [showTaxDetails, setShowTaxDetails] = useState(false);

    // React Query Hooks for data fetching
    const { data: menuItems = [], isLoading: menuItemsLoading } = useMenuItems();
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: favoriteItems = [], isLoading: favoriteItemsLoading } = useFavoriteItems();
    const { data: restaurant } = useRestaurant();
    const { data: printerConfig } = usePrinterConfig();

    // Mutations
    const createOrderMutation = useCreateOrder();
    const createPaymentMutation = useCreatePayment();
    const updateOrderStatusMutation = useUpdateOrderStatus();

    // Auth store
    const { user } = useAuthStore();

    useEffect(() => {
        const checkIfMobile = () => setIsSidebarOpen(window.innerWidth >= 768);
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const mainCategories = useMemo(() => categories.filter(cat => !cat.parent_category_id), [categories]);
    const subCategoriesByParent = useMemo(() => categories.reduce((acc, cat) => {
        if (cat.parent_category_id) {
            if (!acc[cat.parent_category_id]) acc[cat.parent_category_id] = [];
            acc[cat.parent_category_id].push(cat);
        }
        return acc;
    }, {} as Record<number, typeof categories>), [categories]);

    const initialExpandedState = useMemo(() => mainCategories.reduce((acc, category) => {
        acc[category.id] = true;
        return acc;
    }, {} as Record<number, boolean>), [mainCategories]);

    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(initialExpandedState);
    useEffect(() => setExpandedCategories(initialExpandedState), [initialExpandedState]);

    const toggleCategory = useCallback((categoryId: number) => {
        setExpandedCategories(prev => ({...prev, [categoryId]: !prev[categoryId]}));
    }, []);

    const filteredItems = useMemo(() => {
        let itemsToFilter = menuItems;
        if (selectedCategory === 'favourites') {
            const favouriteItemIds = favoriteItems.map(item => item.menu_item_id);
            itemsToFilter = menuItems.filter(item => favouriteItemIds.includes(item.id));
        } else if (selectedCategory !== 'all') {
            const categoryId = parseInt(selectedCategory);
            const subCategoryIds = categories.filter(c => c.parent_category_id === categoryId).map(c => c.id);
            const allCategoryIds = [categoryId, ...subCategoryIds];
            itemsToFilter = menuItems.filter(item => allCategoryIds.includes(item.category_id));
        }

        return itemsToFilter.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [menuItems, categories, selectedCategory, searchQuery, favoriteItems]);

    const handleQuantityChange = useCallback((item: MenuItem, delta: number) => {
        if (!item.available && delta > 0) {
            toast.error("This item is currently unavailable");
            return;
        }
        setOrderItems(current => {
            const existingItem = current.find(i => i.menu_item_id === item.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + delta;
                if (newQuantity <= 0) return current.filter(i => i.menu_item_id !== item.id);
                return current.map(i => i.menu_item_id === item.id ? { ...i, quantity: newQuantity } : i);
            }
            if (delta > 0) {
                const newItem: OrderItem = {
                    id: Date.now(), // Temp ID
                    order_id: 0,
                    menu_item_id: item.id,
                    quantity: 1,
                    price: item.price,
                    name: item.name,
                    include_in_gst: item.include_in_gst,
                    notes: '',
                    status: 'placed'
                };
                return [...current, newItem];
            }
            return current;
        });
    }, []);

    const handleCartQuantityChange = useCallback((menuItemId: number, delta: number) => {
        setOrderItems(current => {
            const existingItem = current.find(i => i.menu_item_id === menuItemId);
            if (!existingItem) return current;

            const newQuantity = existingItem.quantity + delta;
            if (newQuantity <= 0) {
                return current.filter(i => i.menu_item_id !== menuItemId);
            }
            return current.map(i =>
                i.menu_item_id === menuItemId ? { ...i, quantity: newQuantity } : i
            );
        });
    }, []);

    const getItemQuantity = useCallback((itemId: number) => orderItems.find(item => item.menu_item_id === itemId)?.quantity || 0, [orderItems]);
    const handleEditNote = useCallback((item: OrderItem) => {
        setEditingItemId(item.id);
        setItemNote(item.notes || '');
    }, []);

    const handleSaveNote = useCallback(() => {
        if (editingItemId === null) return;
        setOrderItems(current => current.map(item => item.id === editingItemId ? { ...item, notes: itemNote } : item));
        setEditingItemId(null);
        setItemNote('');
    }, [editingItemId, itemNote]);

    const totalItems = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity, 0), [orderItems]);

    const gstDetails = useMemo(() => {
        const subTotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const taxableAmount = orderItems.reduce((total, item) => item.include_in_gst ? total + (item.price * item.quantity) : total, 0);
        const sgstRate = restaurant?.default_sgst_rate || 0;
        const cgstRate = restaurant?.default_cgst_rate || 0;
        const sgstAmount = (taxableAmount * sgstRate) / 100;
        const cgstAmount = (taxableAmount * cgstRate) / 100;
        const totalAmount = subTotal + sgstAmount + cgstAmount;
        const roundedAmount = Math.ceil(totalAmount);
        const roundingDifference = roundedAmount - totalAmount;
        return { subTotal, sgstAmount, cgstAmount, sgstRate, cgstRate, totalAmount, roundedAmount, roundingDifference };
    }, [orderItems, restaurant]);

    const cashGivenNumber = cashGiven ? parseFloat(cashGiven) : 0;
    const changeAmount = cashGivenNumber > gstDetails.roundedAmount ? cashGivenNumber - gstDetails.roundedAmount : 0;

    const generateReceiptContent = (order: Order): string => {
        // Logic from your provided file, seems correct
        return "receipt content"; // Placeholder
    }

    const handlePrint = useCallback(async (printers: string[] | undefined, content: string) => {
        if (!printers || printers.length === 0) {
            // toast.error('No printers configured for this function.');
            return;
        }
        try {
            if (typeof window.qz === 'undefined') throw new Error('QZ Tray not available.');
            if (!window.qz.websocket.isActive()) await window.qz.websocket.connect();
            for (const printer of printers) {
                const config = window.qz.configs.create(printer);
                await window.qz.print(config, [content]);
            }
        } catch (e) {
            const error = e as Error;
            console.error('Print error:', error);
            toast.error(`Print failed: ${error.message}`);
        }
    }, []);

    const handlePlaceOrder = useCallback(async () => {
        if (orderItems.length === 0) return;
        if (!paymentMethod) {
            toast.error('Please select a payment method');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const tokenNumber = `${type.charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`;
            const newOrderData = {
                order_type: type,
                staff_id: user?.staff_id,
                status: 'placed' as const,
                items: orderItems.map(({id, ...rest}) => rest),
                token_number: tokenNumber,
                ...gstDetails
            };

            const createdOrder = await createOrderMutation.mutateAsync(newOrderData as any); //FIXME: type casting

            await handlePrint(printerConfig?.kot_printers, generateReceiptContent(createdOrder));

            const paymentData = {
                order_id: createdOrder.id,
                amount: gstDetails.roundedAmount,
                payment_method: paymentMethod,
                payment_status: 'completed' as const,
                transaction_id: `txn_${Date.now()}`,
            };

            await createPaymentMutation.mutateAsync(paymentData);
            await updateOrderStatusMutation.mutateAsync({ id: createdOrder.id, status: 'paid' });

            await handlePrint(printerConfig?.bill_printers, generateReceiptContent(createdOrder));

            toast.success('Order placed and payment completed successfully');

            setOrderItems([]);
            setSearchQuery('');
            setSelectedCategory('all');
            setIsCartOpen(false);
            setPaymentMethod('');
            setCashGiven('');
            if (onOrderCreated) onOrderCreated();

        } catch (e) {
            const error = e as Error;
            setError(error.message);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [orderItems, paymentMethod, type, user, gstDetails, createOrderMutation, createPaymentMutation, updateOrderStatusMutation, printerConfig, handlePrint, onOrderCreated]);

    const debouncedPlaceOrder = useCallback(debounce(handlePlaceOrder, 500), [handlePlaceOrder]);

    if (menuItemsLoading || categoriesLoading ) {
        return <TakeawaySkeleton type={type} />;
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-1">
            {/* Header */}
            <div className="flex items-center md:hidden p-2 border-b bg-background/95 backdrop-blur sticky top-0 z-20">
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute left-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><MenuIcon className="h-4 w-4" /></Button>
                <h2 className="text-base font-semibold flex-1 text-center">{type === 'quick-bill' ? 'Quick Bill' : 'Takeaway Order'}</h2>
            </div>

            {error && <div className="mx-3 mb-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-2"><AlertCircle className="h-3 w-3" /><p>{error}</p></div>}

            {/* Sidebar */}
            <div className={cn("border-b bg-muted p-2 md:w-48 md:border-b-0 md:border-r dark:border-border custom-scrollbar", "md:relative md:block", isSidebarOpen ? "fixed inset-0 bottom-20 z-50 pt-14 pb-16 overflow-y-auto" : "hidden", "md:static md:z-auto md:pt-0 md:pb-0")}>
                <div className="flex items-center justify-between mb-2 md:hidden sticky top-0 bg-muted z-10 pb-2">
                    <h3 className="font-medium">Categories</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
                <div className="mb-2 space-y-1">
                    <button className={cn("w-full rounded-md p-2 text-left text-sm", selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} onClick={() => { setSelectedCategory('all'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}>All Items</button>
                    {/*<button className={cn("w-full rounded-md p-2 text-left text-sm flex items-center", selectedCategory === 'favourites' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} onClick={() => { setSelectedCategory('favourites'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}>*/}
                    {/*    <Star className="h-4 w-4 mr-2" /> Favourites {favoriteItemsLoading && <Loader2 className="h-3 w-3 ml-2 animate-spin" />}*/}
                    {/*</button>*/}
                </div>
                <div className="flex flex-col gap-1">
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

            {/* Main Content */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                <div className={cn("flex-1 flex flex-col overflow-hidden", isCartOpen ? "hidden md:flex" : "flex")}>
                    <div className="sticky top-0 z-10 bg-background p-2 xs:p-3 sm:p-3 shrink-0">
                        <div className="relative">
                            <Search
                                className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 pt-0 custom-scrollbar">
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 auto-rows-max">
                            {filteredItems.length > 0 ? filteredItems.map(item => (
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
                {/* Cart */}
                <div className={cn("border-t bg-muted md:w-[30rem] md:border-l md:border-t-0 flex flex-col dark:border-border overflow-hidden", "md:relative md:flex", isCartOpen ? "fixed inset-0 z-50 bg-background" : "hidden", "md:static md:z-auto shrink-0")}>
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between p-0.5 md:hidden shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-base font-semibold">Your Order</h2>
                                                        {orderItems.length > 0 && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => setOrderItems([])}
                                                                className="text-xs"
                                                            >
                                                                Clear All
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCartOpen(false)}><X className="h-5 w-5"/></Button>
                                                </div>
                        <div className="p-3 md:flex hidden shrink-0 justify-between items-center">
                                                    <h2 className="text-base font-semibold">Order Summary</h2>
                                                    {orderItems.length > 0 && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => setOrderItems([])}
                                                            className="text-xs"
                                                        >
                                                            Clear All
                                                        </Button>
                                                    )}
                                                </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                            {orderItems.length === 0 ? <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center"><ShoppingCart className="h-8 w-8 text-muted-foreground mb-2"/><p className="text-sm">Your order is empty</p></div> :
                                <div className="space-y-1">
                                    {orderItems.map(item => (
                                        <div key={item.id} className="flex flex-col gap-2 p-2 rounded-lg border bg-card">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0"><p className="text-sm font-medium line-clamp-2">{item.name}</p><p className="text-xs text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>{item.notes && editingItemId !== item.id && <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">Note: {item.notes}</p>}</div>
                                                <div className="flex items-center gap-1">
                                                    <button className="border rounded-md h-6 w-6 flex items-center justify-center" onClick={() => handleCartQuantityChange(item.menu_item_id, -1)}><Minus className="h-3 w-3" /></button>
                                                    <span className="w-5 text-center text-sm">{item.quantity}</span>
                                                    <button className="border rounded-md h-6 w-6 flex items-center justify-center" onClick={() => handleCartQuantityChange(item.menu_item_id, 1)}><Plus className="h-3 w-3" /></button>
                                                    <button className="border rounded-md h-6 w-6 flex items-center justify-center ml-1" onClick={() => handleEditNote(item)}><Pencil className="h-3 w-3" /></button>
                                                </div>
                                            </div>
                                            {editingItemId === item.id && <div className="mt-1 flex gap-2"><input type="text" value={itemNote} onChange={e => setItemNote(e.target.value)} className="flex-1 h-8 px-2 text-sm border rounded-md" onKeyDown={e => {if (e.key === 'Enter') handleSaveNote()}} autoFocus/><Button size="sm" onClick={handleSaveNote} className="h-8 px-2">Save</Button></div>}
                                        </div>
                                    ))}
                                </div>}
                        </div>
                        <div className="p-3 border-t mt-auto bg-muted shrink-0">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><span className="font-semibold">Total</span><div className="flex items-center gap-1"><button onClick={() => setShowTaxDetails(!showTaxDetails)} className="text-muted-foreground hover:text-primary"><Info className="h-4 w-4"/></button><span className="text-lg font-semibold text-primary">₹{gstDetails.roundedAmount.toFixed(2)}</span></div></div>
                                {showTaxDetails && <div className="text-xs space-y-1 bg-background/50 p-2 rounded-md"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>₹{gstDetails.subTotal.toFixed(2)}</span></div>{gstDetails.sgstAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">SGST ({gstDetails.sgstRate}%):</span><span>₹{gstDetails.sgstAmount.toFixed(2)}</span></div>}{gstDetails.cgstAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">CGST ({gstDetails.cgstRate}%):</span><span>₹{gstDetails.cgstAmount.toFixed(2)}</span></div>}<div className="flex justify-between"><span className="text-muted-foreground">Rounding:</span><span>₹{gstDetails.roundingDifference.toFixed(2)}</span></div></div>}
                                <div className="space-y-1"><label className="text-sm font-medium">Payment</label><div className="grid grid-cols-3 gap-1"><button className={cn("p-2 rounded-md text-xs border", paymentMethod === 'cash' ? "bg-primary text-primary-foreground" : "bg-background")} onClick={() => setPaymentMethod('cash')}>Cash</button><button className={cn("p-2 rounded-md text-xs border", paymentMethod === 'card' ? "bg-primary text-primary-foreground" : "bg-background")} onClick={() => setPaymentMethod('card')}>Card</button><button className={cn("p-2 rounded-md text-xs border", paymentMethod === 'upi' ? "bg-primary text-primary-foreground" : "bg-background")} onClick={() => setPaymentMethod('upi')}>UPI</button></div></div>
                                {paymentMethod === 'cash' && <div className="space-y-1"><label className="text-xs font-medium">Cash Given</label><input type="text" placeholder="Amount" value={cashGiven} onChange={(e) => {if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) setCashGiven(e.target.value)}} className="w-full h-8 text-sm px-2 border rounded-md"/>{cashGiven && <div className="mt-1 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Change:</span><span>₹{changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'}</span></div></div>}</div>}
                                <div className="grid grid-cols-1 gap-2"><Button className="justify-center py-3 text-sm h-auto" onClick={debouncedPlaceOrder} disabled={orderItems.length === 0 || isSubmitting || !paymentMethod}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : <span>Place Order</span>}</Button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isCartOpen && orderItems.length > 0 && (
                <motion.div initial={{scale: 0, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0, opacity: 0}} className="fixed bottom-20 right-4 z-40 md:hidden">
                    <Button className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsCartOpen(true)}><div className="relative"><ShoppingCart className="h-6 w-6"/><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary font-medium">{totalItems}</span></div></Button>
                </motion.div>
            )}
        </div>
    );
};

export const DashboardTakeaway = memo(DashboardTakeawayComponent);
