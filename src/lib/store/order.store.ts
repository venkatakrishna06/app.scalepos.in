import {create} from 'zustand';
import {MenuItem, Order, OrderItem} from '@/types';
import {orderService} from '@/lib/api/services/order.service';
import {toast} from '@/lib/toast';
import {useRestaurantStore} from './restaurant.store';

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
  }) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<Order>;
  updateOrder: (id: number, updates: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: number, status: Order['status']) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  addItemsToOrder: (orderId: number, items: OrderItem[]) => Promise<void>;
  updateOrderItem: (orderId: number, itemId: number, updates: Partial<OrderItem>) => Promise<void>;
  removeOrderItem: (orderId: number, itemId: number) => Promise<void>;

  // Helper methods for order status tracking
  isOrderStatusAllowed: (status: Order['status']) => boolean;
  isOrderItemStatusAllowed: (status: OrderItem['status']) => boolean;

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
// Define allowed statuses when tracking is disabled
const BASIC_ORDER_STATUSES = ['placed', 'paid', 'cancelled'];
const BASIC_ORDER_ITEM_STATUSES = ['placed', 'cancelled'];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // Helper methods for order status tracking
  isOrderStatusAllowed: (status) => {
    const restaurant = useRestaurantStore.getState().restaurant;

    // If tracking is disabled, only allow basic statuses
    if (restaurant && !restaurant.enable_order_status_tracking) {
      return BASIC_ORDER_STATUSES.includes(status);
    }

    // If tracking is enabled, allow all statuses
    return true;
  },

  isOrderItemStatusAllowed: (status) => {
    const restaurant = useRestaurantStore.getState().restaurant;

    // If tracking is disabled, only allow basic statuses
    if (restaurant && !restaurant.enable_order_status_tracking) {
      return BASIC_ORDER_ITEM_STATUSES.includes(status);
    }

    // If tracking is enabled, allow all statuses
    return true;
  },

  fetchOrders: async (params) => {
    try {
      set({ loading: true, error: null });

      // Fetch from API directly (no caching)
      const orders = await orderService.getOrders(params);
      set({ orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      set(state => ({ orders: [...state.orders, newOrder] }));
      toast.success('Order created successfully');
      return newOrder; // Explicitly return the created order
    } catch (err) {

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
    } catch (error) {
      console.error('Error updating order:', error);
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

      // Check if the status is allowed based on tracking settings
      if (!get().isOrderStatusAllowed(status)) {
        const errorMessage = `Status '${status}' is not allowed when order tracking is disabled`;
        set({ error: errorMessage });
        toast.error(errorMessage);
        return;
      }

      await get().updateOrder(id, { status });
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error(`Error updating order status to ${status}:`, error);
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
    } catch (error) {
      console.error('Error deleting order:', error);
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
    } catch (error) {
      console.error('Error adding items to order:', error);
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

      // Check if status update is allowed based on tracking settings
      if (updates.status && !get().isOrderItemStatusAllowed(updates.status)) {
        const errorMessage = `Item status '${updates.status}' is not allowed when order tracking is disabled`;
        set({ error: errorMessage });
        toast.error(errorMessage);
        return;
      }

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
    } catch (err) {
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

    // Calculate taxable amount (only for items with include_in_gst = true)
    const taxableAmount = validItems.reduce(
        (sum, item) => {
          // Check if the item has include_in_gst property and it's true
          if (item.include_in_gst === true) {
            return sum + (item.price * item.quantity);
          }
          return sum;
        },
        0
    );

    // Calculate tax amounts based on taxable amount
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const cgstAmount = (taxableAmount * cgstRate) / 100;

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

  getOrdersByTable:  (tableId) => {
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
