import {memo, useCallback, useMemo, useState} from 'react';
import {TakeawaySkeleton} from '@/components/skeletons/takeaway-skeleton';
import {OrderItem} from '@/types';
import {useAuthStore} from "@/lib/store/auth.store";
import {toast} from '@/lib/toast';
import {useCategories, useMenuItems} from '@/api/menu';
import {useCreateOrder, useUpdateOrderStatus} from '@/api/orders';
import {useCreatePayment} from '@/api/payments';
import {useRestaurant} from '@/api/restaurant';
import {usePrinterConfig} from '@/api/printers';
import {MenuItemAnalytics} from '@/types/analytics';

// ... (ESCPOS constants and helper functions remain the same)

interface DashboardTakeawayProps {
    onOrderCreated?: () => void;
    type: string;
}

const DashboardTakeawayComponent: React.FC<DashboardTakeawayProps> = ({
                                                                          onOrderCreated,
                                                                          type
                                                                      }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [favouriteItems, setFavouriteItems] = useState<MenuItemAnalytics[]>([]);
    const [isLoadingFavourites, setIsLoadingFavourites] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemNote, setItemNote] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | ''>('');
    const [cashGiven, setCashGiven] = useState<string>('');
    const [showTaxDetails, setShowTaxDetails] = useState(false);

    const {data: menuItems = [], isLoading: menuItemsLoading} = useMenuItems();
    const {data: categories = [], isLoading: categoriesLoading} = useCategories();
    const {data: restaurant} = useRestaurant();
    const {data: printerConfig} = usePrinterConfig();
    const createOrderMutation = useCreateOrder();
    const createPaymentMutation = useCreatePayment();
    const updateOrderStatusMutation = useUpdateOrderStatus();
    const {user} = useAuthStore();

    // ... (useEffect for sidebar, fetch favourites, etc. remain the same)

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
            const favouriteItemIds = favouriteItems.map(item => item.menu_item_id);
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
    }, [menuItems, selectedCategory, searchQuery, favouriteItems]);

    // ... (handleQuantityChange, getItemQuantity, handleEditNote, handleSaveNote remain the same)

    const totalItems = useMemo(() =>
            orderItems.reduce((sum, item) => sum + item.quantity, 0),
        [orderItems]);

    const calculateOrderTotals = (items: OrderItem[]) => {
        const subTotal = items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        const taxableAmount = items.reduce((total, item) => {
            if (item.include_in_gst === true) {
                return total + (item.price * item.quantity);
            }
            return total;
        }, 0);
        const sgstAmount = (taxableAmount * (restaurant?.default_sgst_rate || 0)) / 100;
        const cgstAmount = (taxableAmount * (restaurant?.default_cgst_rate || 0)) / 100;
        const totalAmount = subTotal + sgstAmount + cgstAmount;
        return {
            subTotal,
            sgstAmount,
            cgstAmount,
            totalAmount
        };
    };

    const gstDetails = useMemo(() => {
        const {subTotal, sgstAmount, cgstAmount, totalAmount} = calculateOrderTotals(orderItems);
        return {
            subTotal,
            sgstAmount,
            cgstAmount,
            sgstRate: restaurant?.default_sgst_rate || 0,
            cgstRate: restaurant?.default_cgst_rate || 0,
            totalAmount,
            roundedAmount: Math.ceil(totalAmount),
            roundingDifference: Math.ceil(totalAmount) - totalAmount
        };
    }, [orderItems, restaurant]);

    const cashGivenNumber = cashGiven ? parseFloat(cashGiven) : 0;
    const changeAmount = cashGivenNumber > gstDetails.roundedAmount ? cashGivenNumber - gstDetails.roundedAmount : 0;

    // ... (generateReceiptContent, handlePrintBill, generateKOTContent, handlePrintKOT remain the same, but remove direct store access)

    const handlePlaceOrder = useCallback(async () => {
        if (orderItems.length === 0) return;
        if (!paymentMethod) {
            setError('Please select a payment method');
            toast.error('Please select a payment method');
            return;
        }

        try {
            const tokenNumber = `${type.charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`;
            const newOrder = {
                order_type: type,
                customer_id: 1,
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
                sub_total: gstDetails.subTotal,
                sgst_rate: gstDetails.sgstRate,
                cgst_rate: gstDetails.cgstRate,
                sgst_amount: gstDetails.sgstAmount,
                cgst_amount: gstDetails.cgstAmount,
                total_amount: gstDetails.totalAmount
            };

            const createdOrder = await createOrderMutation.mutateAsync(newOrder);

            const payment = {
                order_id: createdOrder.id,
                amount: gstDetails.roundedAmount,
                payment_method: paymentMethod,
                payment_status: 'completed',
                transaction_id: `txn_${Date.now()}`,
            };

            await createPaymentMutation.mutateAsync(payment);
            await updateOrderStatusMutation.mutateAsync({id: createdOrder.id, status: 'paid'});

            // handlePrintBill(createdOrder);
            toast.success('Order placed and payment completed successfully');
            setOrderItems([]);
            setSearchQuery('');
            setSelectedCategory('all');
            setIsCartOpen(false);
            setPaymentMethod('');
            setCashGiven('');

            if (onOrderCreated) {
                onOrderCreated();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }, [orderItems, user, type, paymentMethod, gstDetails, createOrderMutation, createPaymentMutation, updateOrderStatusMutation, onOrderCreated]);

    if (menuItemsLoading || categoriesLoading) {
        return <TakeawaySkeleton type={type as 'takeaway' | 'quick-bill'}/>;
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-1">
            {/* ... (rest of the JSX remains the same, but remove direct store access) */}
        </div>
    );
};

export const DashboardTakeaway = memo(DashboardTakeawayComponent);
