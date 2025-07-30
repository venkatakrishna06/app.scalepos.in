import {memo, useCallback, useMemo, useState} from 'react';
import {ChevronRight, Loader2} from 'lucide-react';
import {Dialog, DialogContent} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Order, OrderItem} from '@/types';
import {toast} from '@/lib/toast';
import {useAuthStore} from "@/lib/auth/auth.store";
import {generateTokenNumber} from '@/lib/utils';
import {useCategories, useMenuItems} from '@/api/menu';
import {useCreateOrder, useUpdateOrder} from '@/api/orders';
import {usePrinterConfig} from '@/api/printers';
import {useFavoriteItems} from '@/api/analytics';

// ... (ESCPOS constants and helper functions remain the same)

interface CreateOrderDialogProps {
    open: boolean;
    onClose: () => void;
    table_id?: number;
    existingOrder?: Order | null;
    orderType?: 'dine-in' | 'takeaway' | 'quick-bill';
}

function CreateOrderDialogComponent({
                                        open,
                                        onClose,
                                        table_id,
                                        existingOrder,
                                        orderType
                                    }: CreateOrderDialogProps) {
    const {data: menuItems = [], isLoading: menuItemsLoading} = useMenuItems();
    const {data: categories = [], isLoading: categoriesLoading} = useCategories();
    const {data: printerConfig} = usePrinterConfig();
    const {data: favoriteItems = [], isLoading: favoriteItemsLoading} = useFavoriteItems();

    const createOrderMutation = useCreateOrder();
    const updateOrderMutation = useUpdateOrder();
    const {user} = useAuthStore(state => ({user: state.user}));

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orderItems, setOrderItems] = useState<OrderItem[]>(existingOrder?.items || []);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemNote, setItemNote] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [currentOrderType, setCurrentOrderType] = useState<'dine-in' | 'takeaway' | 'quick-bill'>(table_id ? 'dine-in' : orderType || 'takeaway');

    // ... (useEffect for sidebar, etc. remain the same)

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

    const initialExpandedState = useMemo(() =>
            mainCategories.reduce((acc, category) => {
                if (subCategoriesByParent[category.id]) {
                    acc[category.id] = true;
                }
                return acc;
            }, {} as Record<number, boolean>),
        [mainCategories, subCategoriesByParent]);

    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(initialExpandedState);

    const toggleCategory = useCallback((categoryId: number) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    }, []);

    const filteredItems = useMemo(() => {
        if (selectedCategory === 'favourites') {
            const favouriteItemIds = favoriteItems.map(item => item.menu_item_id);
            return menuItems.filter(item => {
                const isFavourite = favouriteItemIds.includes(item.id);
                const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                return isFavourite && matchesSearch;
            });
        }
        return menuItems.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category_id === parseInt(selectedCategory);
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menuItems, selectedCategory, searchQuery, favoriteItems]);

    // ... (handleQuantityChange, getItemQuantity, handleEditNote, handleSaveNote remain the same)

    const handleSubmitOrder = useCallback(async () => {
        try {
            if (existingOrder) {
                const itemsWithDetails = orderItems.map(item => {
                    const menuItem = menuItems.find(m => m.id === item.menu_item_id);
                    return {
                        ...item,
                        price: menuItem?.price || 0,
                        name: menuItem?.name || '',
                        include_in_gst: menuItem?.include_in_gst
                    };
                });

                await updateOrderMutation.mutateAsync({id: existingOrder.id, order: {items: itemsWithDetails}});
            } else {
                const newOrder = {
                    table_id: table_id,
                    customer_id: 1,
                    staff_id: user?.staff_id,
                    status: 'placed' as const,
                    order_time: new Date().toISOString(),
                    order_type: table_id ? 'dine-in' : currentOrderType,
                    token_number: !table_id ? generateTokenNumber() : undefined,
                    items: orderItems.map(item => {
                        const menuItem = menuItems.find(m => m.id === item.menu_item_id);
                        return {
                            menu_item_id: item.menu_item_id,
                            quantity: item.quantity,
                            notes: item.notes || '',
                            include_in_gst: menuItem?.include_in_gst,
                            name: menuItem?.name,
                            price: menuItem?.price,
                        };
                    })
                };
                await createOrderMutation.mutateAsync(newOrder);
            }

            // handlePrintKOT();
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
            toast.error(errorMessage);
        }
    }, [
        existingOrder,
        orderItems,
        menuItems,
        table_id,
        user,
        currentOrderType,
        onClose,
        createOrderMutation,
        updateOrderMutation
    ]);

    const totalAmount = useMemo(() =>
            orderItems.reduce(
                (sum, item) => {
                    const menuItem = menuItems.find(m => m.id === item.menu_item_id);
                    return sum + (menuItem?.price || 0) * item.quantity;
                },
                0
            ),
        [orderItems, menuItems]);

    const totalItems = useMemo(() =>
            orderItems.reduce((sum, item) => sum + item.quantity, 0),
        [orderItems]);

    if (menuItemsLoading || categoriesLoading) {
        return <div>Loading...</div>
    }

    return (
        <Dialog open={open}>
            <DialogContent
                onClose={onClose}
                className="h-[90vh] max-h-[90vh] max-w-[90vw] md:max-w-[90vw] lg:max-w-[80vw] p-0 sm:p-2 overflow-hidden">
                <div className="flex h-full flex-col overflow-hidden">
                    {/* ... (rest of the JSX remains the same, but remove direct store access) */}
                    <Button
                        className="w-full justify-between py-4 text-base"
                        onClick={handleSubmitOrder}
                        disabled={orderItems.length === 0 || createOrderMutation.isLoading || updateOrderMutation.isLoading}
                    >
                        {(createOrderMutation.isLoading || updateOrderMutation.isLoading) ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>{existingOrder ? 'Update Order' : 'Place Order'}</span>
                                <ChevronRight className="h-5 w-5"/>
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const CreateOrderDialog = memo(CreateOrderDialogComponent);
