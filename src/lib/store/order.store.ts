import {create} from 'zustand';
import {MenuItem, Order, OrderItem} from '@/types';
import {orderService} from '@/lib/api/services/order.service';
import {toast} from '@/lib/toast';
import {CACHE_KEYS, cacheService} from '@/lib/services/cache.service';

// Default tax rates
const DEFAULT_SGST_RATE = 2.5;
const DEFAULT_CGST_RATE = 2.5;

/**
 * Helper function to get default tax rates
 * Uses default values to avoid circular dependencies
 * @returns Default tax rates or fallback values
 */
const getDefaultTaxRates = (): { sgstRate: number; cgstRate: number } => {
  return {
    sgstRate: DEFAULT_SGST_RATE,
    cgstRate: DEFAULT_CGST_RATE
  };
};

interface OrderState {
  // State
  orders: Order[];
  loading: boolean;
  error: string | null;

  // API Actions
  fetchOrders: (params?: {
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    table_number?: number;
  }, skipCache?: boolean) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<Order>;
  updateOrder: (id: number, updates: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: number, status: Order['status']) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  addItemsToOrder: (orderId: number, items: OrderItem[]) => Promise<void>;
  updateOrderItem: (orderId: number, itemId: number, updates: Partial<OrderItem>) => Promise<void>;
  removeOrderItem: (orderId: number, itemId: number) => Promise<void>;

  // Calculations
  calculateOrderTotals: (items: OrderItem[], sgstRate?: number, cgstRate?: number) => {
    subTotal: number;
    sgstAmount: number;
    cgstAmount: number;
    totalAmount: number;
  };

  // Selectors
  getOrderById: (id: number) => Order | undefined;
  getOrdersByTable: (tableId: number) => Order[];
  getActiveOrders: () => Order[];
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersByStaff: (staffId: number) => Order[];
  getOrdersWithItems: () => (Order & { menuItems?: MenuItem[] })[];
}

/**
 * Store for managing orders
 *
 * This store handles:
 * - Fetching orders from the API
 * - Adding, updating, and deleting orders
 * - Managing order status
 * - Adding, updating, and removing order items
 * - Calculating order totals including taxes
 */
export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (params, skipCache = false) => {
    try {
      set({ loading: true, error: null });

      // Try to get data from cache first if skipCache is false
      if (!skipCache) {
        const cachedOrders = cacheService.getCache<Order[]>(CACHE_KEYS.ORDERS);
        if (cachedOrders) {
          console.log('Using cached orders data');
          set({ orders: cachedOrders });
          set({ loading: false });

          // Fetch in background to update cache silently
          orderService.getOrders(params).then(freshOrders => {
            cacheService.setCache(CACHE_KEYS.ORDERS, freshOrders);
            set({ orders: freshOrders });
          }).catch(err => {
            console.error('Background fetch for orders failed:', err);
          });

          return;
        }
      }

      // If skipCache is true or no valid cache, fetch from API
      const orders = await orderService.getOrders(params);

      // Update cache
      cacheService.setCache(CACHE_KEYS.ORDERS, orders);

      set({ orders });
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      const errorMessage = 'Failed to fetch orders';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  addOrder: async (order) => {
    try {
      set({ loading: true, error: null });

      // Calculate totals if not provided
      if (!order.sub_total || !order.total_amount) {
        // Get default tax rates
        const { sgstRate, cgstRate } = getDefaultTaxRates();
        const finalSgstRate = order.sgst_rate ?? sgstRate;
        const finalCgstRate = order.cgst_rate ?? cgstRate;

        const { subTotal, sgstAmount, cgstAmount, totalAmount } =
            get().calculateOrderTotals(order.items, finalSgstRate, finalCgstRate);

        order = {
          ...order,
          sub_total: subTotal,
          sgst_rate: finalSgstRate,
          cgst_rate: finalCgstRate,
          sgst_amount: sgstAmount,
          cgst_amount: cgstAmount,
          total_amount: totalAmount
        };
      }

      const newOrder = await orderService.createOrder(order);
      //set(state => ({ orders: [...state.orders, newOrder] }));
      toast.success('Order created successfully');
      return newOrder; // Explicitly return the created order
    } catch (err) {
      console.error('Failed to add order:', err);
      const errorMessage = 'Failed to add order';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err; // Re-throw the error to be caught by the caller
    } finally {
      set({ loading: false });
    }
  },

  updateOrder: async (id, updates) => {
    try {
      set({ loading: true, error: null });

      // If items are updated, recalculate totals
      if (updates.items) {
        const order = get().orders.find(o => o.id === id);
        if (order) {
          // Get default tax rates
          const { sgstRate, cgstRate } = getDefaultTaxRates();
          const finalSgstRate = updates.sgst_rate ?? order.sgst_rate ?? sgstRate;
          const finalCgstRate = updates.cgst_rate ?? order.cgst_rate ?? cgstRate;

          const { subTotal, sgstAmount, cgstAmount, totalAmount } =
              get().calculateOrderTotals(updates.items, finalSgstRate, finalCgstRate);

          updates = {
            ...updates,
            sub_total: subTotal,
            sgst_rate: finalSgstRate,
            cgst_rate: finalCgstRate,
            sgst_amount: sgstAmount,
            cgst_amount: cgstAmount,
            total_amount: totalAmount
          };
        }
      }

      const updatedOrder = await orderService.updateOrder(id, updates);
      set(state => ({
        orders: state.orders.map(order =>
            order.id === id ? updatedOrder : order
        ),
      }));
      toast.success('Order updated successfully');
    } catch (err) {
      console.error('Failed to update order:', err);
      const errorMessage = 'Failed to update order';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      await get().updateOrder(id, { status });
      toast.success(`Order status updated to ${status}`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      const errorMessage = `Failed to update order status to ${status}`;
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await orderService.deleteOrder(id);
      set(state => ({
        orders: state.orders.filter(order => order.id !== id),
      }));
      toast.success('Order deleted successfully');
    } catch (err) {
      console.error('Failed to delete order:', err);
      const errorMessage = 'Failed to delete order';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  addItemsToOrder: async (orderId, newItems) => {
    try {
      set({ loading: true, error: null });

      const order = get().orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const updatedItems = [...(order.items || [])];
      newItems.forEach(newItem => {
        const existingItemIndex = updatedItems.findIndex(
            item => item.menu_item_id === newItem.menu_item_id
        );
        if (existingItemIndex >= 0) {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });

      // Get default tax rates
      const { sgstRate, cgstRate } = getDefaultTaxRates();
      const finalSgstRate = order.sgst_rate ?? sgstRate;
      const finalCgstRate = order.cgst_rate ?? cgstRate;

      const { subTotal, sgstAmount, cgstAmount, totalAmount } =
          get().calculateOrderTotals(
              updatedItems,
              finalSgstRate,
              finalCgstRate
          );

      await get().updateOrder(orderId, {
        items: updatedItems,
        sub_total: subTotal,
        sgst_amount: sgstAmount,
        cgst_amount: cgstAmount,
        total_amount: totalAmount
      });

      toast.success('Items added to order');
    } catch (err) {
      console.error('Failed to add items to order:', err);
      const errorMessage = 'Failed to add items to order';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateOrderItem: async (orderId, itemId, updates) => {
    try {
      set({ loading: true, error: null });

      // First update the item through the API
      await orderService.updateOrderItem(orderId, itemId, updates);

      // Then update the local state
      const order = get().orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const updatedItems = order.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
      );

      // Get default tax rates
      const { sgstRate, cgstRate } = getDefaultTaxRates();
      const finalSgstRate = order.sgst_rate ?? sgstRate;
      const finalCgstRate = order.cgst_rate ?? cgstRate;

      const { subTotal, sgstAmount, cgstAmount, totalAmount } =
          get().calculateOrderTotals(
              updatedItems,
              finalSgstRate,
              finalCgstRate
          );

      await get().updateOrder(orderId, {
        items: updatedItems,
        sub_total: subTotal,
        sgst_amount: sgstAmount,
        cgst_amount: cgstAmount,
        total_amount: totalAmount
      });

      toast.success('Order item updated');
    } catch (err) {
      console.error('Failed to update order item:', err);
      const errorMessage = 'Failed to update order item';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  removeOrderItem: async (orderId, itemId) => {
    try {
      set({ loading: true, error: null });

      // First remove the item through the API
      await orderService.removeOrderItem(orderId, itemId);

      // Then update the local state
      const order = get().orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const updatedItems = order.items.filter(item => item.id !== itemId);

      // Get default tax rates
      const { sgstRate, cgstRate } = getDefaultTaxRates();
      const finalSgstRate = order.sgst_rate ?? sgstRate;
      const finalCgstRate = order.cgst_rate ?? cgstRate;

      const { subTotal, sgstAmount, cgstAmount, totalAmount } =
          get().calculateOrderTotals(
              updatedItems,
              finalSgstRate,
              finalCgstRate
          );

      await get().updateOrder(orderId, {
        items: updatedItems,
        sub_total: subTotal,
        sgst_amount: sgstAmount,
        cgst_amount: cgstAmount,
        total_amount: totalAmount
      });

      toast.success('Item removed from order');
    } catch (err) {
      console.error('Failed to remove order item:', err);
      const errorMessage = 'Failed to remove order item';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  calculateOrderTotals: (items, sgstRate = 2.5, cgstRate = 2.5) => {
    // Filter out cancelled items
    const validItems = items.filter(item => item.status !== 'cancelled');

    // Calculate subtotal
    const subTotal = validItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );

    // Calculate tax amounts
    const sgstAmount = (subTotal * sgstRate) / 100;
    const cgstAmount = (subTotal * cgstRate) / 100;

    // Calculate total
    const totalAmount = subTotal + sgstAmount + cgstAmount;

    return {
      subTotal,
      sgstAmount,
      cgstAmount,
      totalAmount
    };
  },

  // Selectors
  getOrderById: (id) => {
    const { orders } = get();
    return orders.find(order => order.id === id);
  },

  getOrdersByTable: (tableId) => {
    const { orders } = get();
    return orders.filter(order =>
        order.table_id === tableId &&
        order.status !== 'paid' &&
        order.status !== 'cancelled'
    );
  },

  getActiveOrders: () => {
    const { orders } = get();
    return orders.filter(order =>
        order.status !== 'paid' &&
        order.status !== 'cancelled'
    );
  },

  getOrdersByStatus: (status) => {
    const { orders } = get();
    return orders.filter(order => order.status === status);
  },

  getOrdersByDateRange: (startDate, endDate) => {
    const { orders } = get();
    return orders.filter(order => {
      const orderDate = new Date(order.order_time);
      return orderDate >= startDate && orderDate <= endDate;
    });
  },

  getOrdersByStaff: (staffId) => {
    const { orders } = get();
    return orders.filter(order => order.staff_id === staffId);
  },

  getOrdersWithItems: () => {
    const { orders } = get();

    // Return orders without menu item details to avoid circular dependencies
    // Menu item details should be fetched separately using the menu store
    return orders.map(order => {
      // Create a new object to avoid mutating the original order
      const orderWithItems = { ...order };

      // Note: menuItems is not populated here to avoid circular dependencies
      // Components should use useMenuStore directly to get menu item details

      return orderWithItems;
    });
  }
}));
