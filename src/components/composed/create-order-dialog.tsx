import {memo, useCallback, useEffect, useMemo, useState, useRef} from 'react';
import { ChevronDown, ChevronRight, Loader2, Menu as MenuIcon, Minus, Pencil, Plus, Search, ShoppingCart, Star, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { MenuItem, Order, OrderItem } from '@/types';
import { toast } from '@/lib/toast';
import { useAuthStore } from "@/lib/auth/auth.store";
import { cn, generateTokenNumber, debounce } from '@/lib/utils';
import { useCategories, useMenuItems } from "@/api/menu";
import { useCreateOrder, useUpdateOrder } from "@/api/orders";
import { useFavoriteItems } from "@/api/analytics";
import { usePrinterConfig } from "@/api/printers";

// Type Definitions and Constants
declare global {
    interface Window { qz: any; }
}

// Helper functions (assuming they are correct as per your file)
const padString = (str: string, width: number) => str.padEnd(width).substring(0, width);
const createSeparatorLine = (char = '-', width = 32) => char.repeat(width);

interface CreateOrderDialogProps {
    open: boolean;
    onClose: () => void;
    table_id?: number;
    existingOrder?: Order | null;
    orderType?: 'dine-in' | 'takeaway' | 'quick-bill';
}

function CreateOrderDialogComponent({ open, onClose, table_id, existingOrder, orderType: initialOrderType }: CreateOrderDialogProps) {
    // Correct data fetching with React Query
    const { data: menuItems = [], isLoading: menuItemsLoading } = useMenuItems();
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: favoriteItems = [], isLoading: favoriteItemsLoading } = useFavoriteItems();
    const { data: printerConfig } = usePrinterConfig();
    const { user } = useAuthStore();

    // Mutations
    const createOrderMutation = useCreateOrder();
    const updateOrderMutation = useUpdateOrder();

    // Component State - Mirrors your original file
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemNote, setItemNote] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [currentOrderType, setCurrentOrderType] = useState<'dine-in' | 'takeaway' | 'quick-bill'>(table_id ? 'dine-in' : initialOrderType || 'takeaway');

    // Sync state on open - Preserved from your file
    useEffect(() => {
        if (open) {
            setCurrentOrderType(table_id ? 'dine-in' : initialOrderType || 'takeaway');
        } else {
            setSearchQuery('');
            setSelectedCategory('all');
        }
        setOrderItems([]);
    }, [open, existingOrder, table_id, initialOrderType]);

    // Responsive sidebar effect - Preserved from your file
    useEffect(() => {
        const checkResize = () => setIsSidebarOpen(window.innerWidth >= 768);
        checkResize();
        window.addEventListener('resize', checkResize);
        return () => window.removeEventListener('resize', checkResize);
    }, []);

    // Memoized calculations for performance - Preserved from your file
    const mainCategories = useMemo(() => categories.filter(c => !c.parent_category_id), [categories]);
    const subCategoriesByParent = useMemo(() => categories.reduce((acc, cat) => {
        if (cat.parent_category_id) { (acc[cat.parent_category_id] = acc[cat.parent_category_id] || []).push(cat); }
        return acc;
    }, {} as Record<number, typeof categories>), [categories]);

    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
    useEffect(() => setExpandedCategories(mainCategories.reduce((acc, cat) => ({...acc, [cat.id]: true }), {})), [mainCategories]);

    const toggleCategory = useCallback((id: number) => setExpandedCategories(p => ({...p, [id]: !p[id]})), []);

    const filteredItems = useMemo(() => {
        let items = menuItems;
        if (selectedCategory === 'favourites') {
            const favIds = new Set(favoriteItems.map(f => f.menu_item_id));
            items = menuItems.filter(item => favIds.has(item.id));
        } else if (selectedCategory !== 'all') {
            const catId = parseInt(selectedCategory);
            const childIds = subCategoriesByParent[catId]?.map(c => c.id) || [];
            const ids = new Set([catId, ...childIds]);
            items = menuItems.filter(item => ids.has(item.category_id));
        }
        return searchQuery ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : items;
    }, [menuItems, categories, selectedCategory, searchQuery, favoriteItems, subCategoriesByParent]);

    const handleQuantityChange = useCallback((item: MenuItem, delta: number) => {
        if (!item.available && delta > 0) return toast.error("This item is unavailable.");
        setOrderItems(current => {
            const existing = current.find(i => i.menu_item_id === item.id);
            if (existing) {
                const newQuantity = existing.quantity + delta;
                if (newQuantity <= 0) return current.filter(i => i.menu_item_id !== item.id);
                return current.map(i => i.menu_item_id === item.id ? { ...i, quantity: newQuantity } : i);
            }
            if (delta > 0) return [...current, { id: Date.now(), order_id: existingOrder?.id || 0, menu_item_id: item.id, quantity: 1, notes: '', include_in_gst: item.include_in_gst, price: item.price, name: item.name, status: 'placed' }];
            return current;
        });
    }, [existingOrder]);

    const handleCartQuantityChange = useCallback((menuItemId: number, delta: number) => {
        setOrderItems(current => {
            const existingItem = current.find(i => i.menu_item_id === menuItemId);
            if (!existingItem) return current;
            const newQuantity = existingItem.quantity + delta;
            if (newQuantity <= 0) return current.filter(i => i.menu_item_id !== menuItemId);
            return current.map(i => i.menu_item_id === menuItemId ? { ...i, quantity: newQuantity } : i);
        });
    }, []);

    const getItemQuantity = useCallback((id: number) => orderItems.find(i => i.menu_item_id === id)?.quantity || 0, [orderItems]);
    const handleEditNote = useCallback((id: number, note: string) => { setEditingItemId(id); setItemNote(note); }, []);
    const handleSaveNote = useCallback(() => {
        if (editingItemId === null) return;
        setOrderItems(c => c.map(i => i.id === editingItemId ? { ...i, notes: itemNote } : i));
        setEditingItemId(null);
    }, [editingItemId, itemNote]);

    const totalAmount = useMemo(() => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [orderItems]);
    const totalItems = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity, 0), [orderItems]);

    const handleSubmitOrder = useCallback(async () => {
        const orderData = {
            table_id: table_id, staff_id: user?.staff_id, status: 'placed' as const, order_type: table_id ? 'dine-in' : currentOrderType,
            items: orderItems.map(({ id, ...rest }) => rest), // Remove temp ID
            total_amount: totalAmount, token_number: !table_id ? generateTokenNumber() : undefined,
        };

        try {
            if (existingOrder) {
                await updateOrderMutation.mutateAsync({ id: existingOrder.id, order: { items: orderData.items } as any });
                toast.success(`Order for Table ${table_id} updated.`);
            } else {
                await createOrderMutation.mutateAsync(orderData as any);
                toast.success(`Order created successfully.`);
            }
            setOrderItems([]); // Clear items on success
            onClose();
        } catch (error) { toast.error(`Order failed: ${(error as Error).message}`); }
    }, [orderItems, table_id, user, totalAmount, existingOrder, currentOrderType, updateOrderMutation, createOrderMutation, onClose]);

    const debouncedSubmitOrder = useCallback(debounce(handleSubmitOrder, 500), [handleSubmitOrder]);

    const isLoading = menuItemsLoading || categoriesLoading || favoriteItemsLoading;
    const isSubmitting = createOrderMutation.isLoading || updateOrderMutation.isLoading;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="h-[90vh] max-h-[90vh] max-w-[90vw] md:max-w-[90vw] lg:max-w-[80vw] p-0 overflow-hidden">
                <div className="flex h-full flex-col overflow-hidden">
                    {/* UI preserved EXACTLY from your file */}
                    <div className="flex items-center md:hidden p-2 border-b shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute left-2"><MenuIcon className="h-5 w-5"/></Button>
                        <h2 className="text-lg font-semibold flex-1 text-center">{table_id ? `Table ${table_id}` : `${currentOrderType.charAt(0).toUpperCase() + currentOrderType.slice(1)} Order`}</h2>
                    </div>
                    {!table_id && (
                        <div className="p-3 border-b shrink-0">
                            <h3 className="text-sm font-semibold mb-2">Order Type</h3>
                            <div className="flex flex-wrap gap-2">
                                <label className={cn('flex items-center p-2 rounded-md border cursor-pointer', currentOrderType === 'takeaway' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent')}><input type="radio" name="order-type" value="takeaway" checked={currentOrderType === 'takeaway'} onChange={() => setCurrentOrderType('takeaway')} className="mr-2"/>Takeaway</label>
                                <label className={cn('flex items-center p-2 rounded-md border cursor-pointer', currentOrderType === 'quick-bill' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent')}><input type="radio" name="order-type" value="quick-bill" checked={currentOrderType === 'quick-bill'} onChange={() => setCurrentOrderType('quick-bill')} className="mr-2"/>Quick Bill</label>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                        <div className={cn("border-b bg-muted p-2 md:w-48 md:border-b-0 md:border-r dark:border-border overflow-y-auto custom-scrollbar", "md:relative md:block", isSidebarOpen ? "block" : "hidden", "max-h-[50vh] md:max-h-none shrink-0")}>
                            <div className="flex items-center justify-between mb-2 md:hidden"><h3 className="font-medium">Categories</h3><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5" /></Button></div>
                            <div className="mb-2 space-y-1">
                                <button className={cn("w-full rounded-md p-2 text-left text-sm", selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground')} onClick={() => setSelectedCategory('all')}>All Items</button>
                                <button className={cn("w-full rounded-md p-2 text-left text-sm flex items-center", selectedCategory === 'favourites' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground')} onClick={() => setSelectedCategory('favourites')}><Star className="h-4 w-4 mr-2"/> Favourites </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                {mainCategories.map(category => (
                                    <div key={category.id} className="category-group">
                                        <div className="flex items-center w-full">
                                            {subCategoriesByParent[category.id] && <button onClick={() => toggleCategory(category.id)} className="p-1 rounded hover:bg-accent">{expandedCategories[category.id] ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}</button>}
                                            <button className={cn("flex-1 rounded-md p-2 text-left text-sm", selectedCategory === category.id.toString() ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground')} onClick={() => { subCategoriesByParent[category.id] ? toggleCategory(category.id) : setSelectedCategory(String(category.id))}}>{category.name}</button>
                                        </div>
                                        {expandedCategories[category.id] && subCategoriesByParent[category.id] && <div className="ml-5 mt-1 space-y-1 border-l-2 border-muted-foreground/20 pl-1">{subCategoriesByParent[category.id].map(sub => <button key={sub.id} className={cn("w-full rounded-md p-2 text-left text-sm", selectedCategory === sub.id.toString() ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground')} onClick={() => setSelectedCategory(sub.id.toString())}>{sub.name}</button>)}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                            <div className={cn("flex-1 flex flex-col overflow-hidden", isCartOpen ? "hidden md:flex" : "flex")}>
                                <div className="sticky top-0 z-10 bg-background p-2 xs:p-3 sm:p-3 shrink-0"><div className="relative"><Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/></div></div>
                                <div className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-3 pt-0 custom-scrollbar">
                                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 auto-rows-max">
                                        {isLoading ? <p>Loading items...</p> : filteredItems.length > 0 ? filteredItems.map(item => (
                                            <div key={item.id} className={cn('relative p-2 rounded-md border bg-card', item.available ? 'cursor-pointer hover:bg-accent/50' : 'cursor-not-allowed opacity-75')} onClick={() => item.available && handleQuantityChange(item, 1)}>
                                                {!item.available && <div className="absolute -top-1 -right-1 z-10"><div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">Unavailable</div></div>}
                                                <div className="flex-1 min-w-0"><h3 className="font-medium leading-tight text-sm line-clamp-2">{item.name}</h3><div className="mt-1 flex items-center justify-between"><span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>{getItemQuantity(item.id) > 0 && <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">Qty: {getItemQuantity(item.id)}</span>}</div></div>
                                            </div>
                                        )) : <div className="col-span-full flex flex-col items-center justify-center py-10 text-center"><Search className="h-10 w-10 text-muted-foreground mb-3"/><p className="text-muted-foreground">No menu items found</p></div>}
                                    </div>
                                </div>
                            </div>
                            <div className={cn("border-t bg-muted md:w-72 md:border-l md:border-t-0 flex flex-col dark:border-border overflow-hidden", "md:relative md:flex", isCartOpen ? "fixed inset-0 z-50 bg-background" : "hidden", "md:static md:z-auto shrink-0")}>
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="flex items-center justify-between p-0.5 md:hidden shrink-0"><h2 className="text-base font-semibold">Your Order</h2><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCartOpen(false)}><X className="h-5 w-5"/></Button></div>
                                    <div className="p-3 md:block hidden shrink-0"><h2 className="text-base font-semibold">Order Summary</h2></div>
                                    <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                                        {orderItems.length === 0 ? <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center"><ShoppingCart className="h-8 w-8 text-muted-foreground mb-2"/><p className="text-sm text-muted-foreground">Your order is empty</p></div> :
                                            <div className="space-y-3">
                                                {orderItems.map(item => (
                                                    <div key={item.id} className="flex flex-col gap-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.name}</p><p className="text-xs text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>{item.notes && editingItemId !== item.id && <p className="text-xs italic text-muted-foreground mt-1">Note: {item.notes}</p>}</div>
                                                            <div className="flex items-center gap-1">
                                                                <button className="border rounded-md h-6 w-6 flex items-center justify-center" onClick={() => handleCartQuantityChange(item.menu_item_id, -1)} disabled={isSubmitting}><Minus className="h-3 w-3"/></button>
                                                                <span className="w-5 text-center text-sm">{item.quantity}</span>
                                                                <button className="border rounded-md h-6 w-6 flex items-center justify-center" onClick={() => handleCartQuantityChange(item.menu_item_id, 1)} disabled={isSubmitting}><Plus className="h-3 w-3"/></button>
                                                                <button className="border rounded-md h-6 w-6 flex items-center justify-center ml-1" onClick={() => handleEditNote(item.id, item.notes || '')} disabled={isSubmitting}><Pencil className="h-3 w-3"/></button>
                                                            </div>
                                                        </div>
                                                        {editingItemId === item.id && <div className="mt-1 flex gap-2"><input type="text" value={itemNote} onChange={e => setItemNote(e.target.value)} className="flex-1 h-8 px-2 text-sm border rounded-md" onKeyDown={e => {if (e.key === 'Enter') handleSaveNote()}} autoFocus/><Button size="sm" onClick={handleSaveNote} className="h-8 px-2">Save</Button></div>}
                                                    </div>
                                                ))}
                                            </div>}
                                    </div>
                                    <div className="p-3 border-t mt-auto bg-muted dark:border-border shrink-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between"><span className="font-semibold">Total Amount</span><span className="text-lg font-semibold text-primary">₹{totalAmount.toFixed(2)}</span></div>
                                            <Button className="w-full justify-between py-4 text-base" onClick={debouncedSubmitOrder} disabled={orderItems.length === 0 || isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : <><span>{existingOrder ? 'Update Order' : 'Place Order'}</span><ChevronRight className="h-5 w-5"/></>}</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {!isCartOpen && orderItems.length > 0 && <Button className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden" onClick={() => setIsCartOpen(true)}><div className="relative"><ShoppingCart className="h-6 w-6"/><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary">{totalItems}</span></div></Button>}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const CreateOrderDialog = memo(CreateOrderDialogComponent);
