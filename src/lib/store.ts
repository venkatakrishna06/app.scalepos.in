import { create } from 'zustand';
import { MenuItem, Order, Table, StaffMember, Payment, Category } from '@/types';
import { menuService } from './api/services/menu.service';
import { orderService } from './api/services/order.service';
import { tableService } from './api/services/table.service';
import { paymentService } from './api/services/payment.service';
import {staffService} from "@/lib/api/services/staff.service.ts";

interface StaffState {
  staff: StaffMember[];
  currentStaff: StaffMember | null;
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  setCurrentStaff: (staff: StaffMember | null) => void;
  addStaff: (staff: Omit<StaffMember, 'id'>) => Promise<void>;
  updateStaff: (id: number, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
}

interface MenuState {
  menuItems: MenuItem[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: number, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: number) => Promise<void>;
  toggleItemAvailability: (id: number) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: number, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  fetchMenuItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

interface TableState {
  tables: Table[];
  loading: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  addTable: (table: Omit<Table, 'id'>) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  updateTableStatus: (id: number, status: Table['status']) => Promise<void>;
  mergeTables: (tableIds: number[]) => Promise<void>;
  splitTable: (tableId: number, capacity: number) => Promise<Table>;
  assignOrder: (tableId: number, orderId: number) => Promise<void>;
  clearTable: (id: number) => Promise<void>;
}

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrder: (id: number, updates: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: number, status: Order['status']) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  getOrdersByTable: (tableId: number) => Order[];
  addItemsToOrder: (orderId: number, items: OrderItem[]) => Promise<void>;
  updateOrderItem: (orderId: number, itemId: number, updates: Partial<OrderItem>) => Promise<void>;
  removeOrderItem: (orderId: number, itemId: number) => Promise<void>;
}

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: () => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePaymentStatus: (id: number, status: Payment['status']) => Promise<void>;
  getPaymentsByOrder: (orderId: number) => Payment[];
}

export const useStaffStore = create<StaffState>((set) => ({
  staff: [],
  currentStaff: null,
  loading: false,
  error: null,

  fetchStaff: async () => {
    try {
      set({ loading: true, error: null });
      const staff = await staffService.getStaff();
      set({ staff });
    } catch (error) {
      set({ error: 'Failed to fetch staff' });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentStaff: (staff) => {
    set({ currentStaff: staff });
  },

  addStaff: async (staff) => {
    try {
      set({ loading: true, error: null });
      const newStaff = await staffService.createStaff(staff);
      set(state => ({ staff: [...state.staff, newStaff] }));
    } catch (error) {
      set({ error: 'Failed to add staff member' });
    } finally {
      set({ loading: false });
    }
  },

  updateStaff: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedStaff = await staffService.updateStaff(id, updates);
      set(state => ({
        staff: state.staff.map(s => s.id === id ? updatedStaff : s),
        currentStaff: state.currentStaff?.id === id ? updatedStaff : state.currentStaff,
      }));
    } catch (error) {
      set({ error: 'Failed to update staff member' });
    } finally {
      set({ loading: false });
    }
  },

  deleteStaff: async (id) => {
    try {
      set({ loading: true, error: null });
      await staffService.deleteStaff(id);
      set(state => ({
        staff: state.staff.filter(s => s.id !== id),
        currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
      }));
    } catch (error) {
      set({ error: 'Failed to delete staff member' });
    } finally {
      set({ loading: false });
    }
  },
}));

export const useMenuStore = create<MenuState>((set, get) => ({
  menuItems: [],
  categories: [],
  loading: false,
  error: null,

  fetchMenuItems: async () => {
    try {
      set({ loading: true, error: null });
      const items = await menuService.getItems();
      set({ menuItems: items });
    } catch (error) {
      set({ error: 'Failed to fetch menu items' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const categories = await menuService.getCategories();
      set({ categories });
    } catch (error) {
      set({ error: 'Failed to fetch categories' });
    } finally {
      set({ loading: false });
    }
  },

  addMenuItem: async (item) => {
    try {
      set({ loading: true, error: null });
      const newItem = await menuService.createItem(item);
      set(state => ({ menuItems: [...state.menuItems, newItem] }));
    } catch (error) {
      set({ error: 'Failed to add menu item' });
    } finally {
      set({ loading: false });
    }
  },

  updateMenuItem: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedItem = await menuService.updateItem(id, updates);
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === id ? updatedItem : item
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update menu item' });
    } finally {
      set({ loading: false });
    }
  },

  deleteMenuItem: async (id) => {
    try {
      set({ loading: true, error: null });
      await menuService.deleteItem(id);
      set(state => ({
        menuItems: state.menuItems.filter(item => item.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete menu item' });
    } finally {
      set({ loading: false });
    }
  },

  toggleItemAvailability: async (id) => {
    const item = get().menuItems.find(item => item.id === id);
    if (item) {
      await get().updateMenuItem(id, { available: !item.available });
    }
  },

  addCategory: async (category) => {
    try {
      set({ loading: true, error: null });
      const newCategory = await menuService.createCategory(category);
      set(state => ({ categories: [...state.categories, newCategory] }));
    } catch (error) {
      set({ error: 'Failed to add category' });
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedCategory = await menuService.updateCategory(id, updates);
      set(state => ({
        categories: state.categories.map(category =>
          category.id === id ? updatedCategory : category
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update category' });
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ loading: true, error: null });
      await menuService.deleteCategory(id);
      set(state => ({
        categories: state.categories.filter(category => category.id !== id),
        menuItems: state.menuItems.filter(
          item => item.category !== state.categories.find(c => c.id === id)?.name
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to delete category' });
    } finally {
      set({ loading: false });
    }
  },
}));

export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  loading: false,
  error: null,

  fetchTables: async () => {
    try {
      set({ loading: true, error: null });
      const tables = await tableService.getTables();
      set({ tables });
    } catch (error) {
      set({ error: 'Failed to fetch tables' });
    } finally {
      set({ loading: false });
    }
  },

  addTable: async (table) => {
    try {
      set({ loading: true, error: null });
      const newTable = await tableService.createTable(table);
      set(state => ({ tables: [...state.tables, newTable] }));
    } catch (error) {
      set({ error: 'Failed to add table' });
    } finally {
      set({ loading: false });
    }
  },

  deleteTable: async (id) => {
    try {
      set({ loading: true, error: null });
      await tableService.deleteTable(id);
      set(state => ({
        tables: state.tables.filter(table => table.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete table' });
    } finally {
      set({ loading: false });
    }
  },

  updateTableStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      const updatedTable = await tableService.updateTable(id, { status });
      set(state => ({
        tables: state.tables.map(table =>
          table.id === id ? updatedTable : table
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update table status' });
    } finally {
      set({ loading: false });
    }
  },

  mergeTables: async (tableIds) => {
    try {
      set({ loading: true, error: null });
      const mainTable = get().tables.find(t => t.id === tableIds[0]);
      if (!mainTable) return;

      const totalCapacity = tableIds.reduce((sum, id) => {
        const table = get().tables.find(t => t.id === id);
        return sum + (table?.capacity || 0);
      }, 0);

      const updatedMainTable = await tableService.updateTable(mainTable.id, {
        capacity: totalCapacity,
        mergedWith: tableIds.slice(1),
      });

      await Promise.all(
        tableIds.slice(1).map(id =>
          tableService.updateTable(id, {
            status: 'occupied',
            mergedWith: [mainTable.id],
          })
        )
      );

      await get().fetchTables();
    } catch (error) {
      set({ error: 'Failed to merge tables' });
    } finally {
      set({ loading: false });
    }
  },

  splitTable: async (tableId, capacity) => {
    try {
      set({ loading: true, error: null });
      const table = get().tables.find(t => t.id === tableId);
      if (!table) throw new Error('Table not found');

      const newTableData = {
        table_number: Math.max(...get().tables.map(t => t.table_number)) + 1,
        capacity,
        status: 'available' as const,
        splitFrom: tableId,
      };

      const [updatedTable, newTable] = await Promise.all([
        tableService.updateTable(tableId, {
          capacity: table.capacity - capacity,
        }),
        tableService.createTable(newTableData),
      ]);

      set(state => ({
        tables: [
          ...state.tables.map(t =>
            t.id === tableId ? updatedTable : t
          ),
          newTable,
        ],
      }));

      return newTable;
    } catch (error) {
      set({ error: 'Failed to split table' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  assignOrder: async (tableId, orderId) => {
    try {
      set({ loading: true, error: null });
      const updatedTable = await tableService.updateTable(tableId, {
        status: 'occupied',
        currentOrderId: orderId,
      });
      set(state => ({
        tables: state.tables.map(table =>
          table.id === tableId ? updatedTable : table
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to assign order to table' });
    } finally {
      set({ loading: false });
    }
  },

  clearTable: async (id) => {
    try {
      set({ loading: true, error: null });
      const updatedTable = await tableService.updateTable(id, {
        status: 'cleaning',
        currentOrderId: undefined,
        mergedWith: undefined,
        splitFrom: undefined,
      });
      set(state => ({
        tables: state.tables.map(table =>
          table.id === id ? updatedTable : table
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to clear table' });
    } finally {
      set({ loading: false });
    }
  },
}));

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    try {
      set({ loading: true, error: null });
      const orders = await orderService.getOrders();
      set({ orders });
    } catch (error) {
      set({ error: 'Failed to fetch orders' });
    } finally {
      set({ loading: false });
    }
  },

  addOrder: async (order) => {
    try {
      set({ loading: true, error: null });
      const newOrder = await orderService.createOrder(order);
      set(state => ({ orders: [...state.orders, newOrder] }));
    } catch (error) {
      set({ error: 'Failed to add order' });
    } finally {
      set({ loading: false });
    }
  },

  updateOrder: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedOrder = await orderService.updateOrder(id, updates);
      set(state => ({
        orders: state.orders.map(order =>
          order.id === id ? updatedOrder : order
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update order' });
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    await get().updateOrder(id, { status });
  },

  deleteOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await orderService.deleteOrder(id);
      set(state => ({
        orders: state.orders.filter(order => order.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete order' });
    } finally {
      set({ loading: false });
    }
  },

  getOrdersByTable: (tableId) => {
    return get().orders.filter(order => order.table_id === tableId);
  },

  addItemsToOrder: async (orderId, newItems) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = [...order.items];
    newItems.forEach(newItem => {
      const existingItemIndex = updatedItems.findIndex(
        item => item.id === newItem.id
      );
      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex].quantity += newItem.quantity;
      } else {
        updatedItems.push(newItem);
      }
    });

    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await get().updateOrder(orderId, {
      items: updatedItems,
      totalAmount,
    });
  },

  updateOrderItem: async (orderId, itemId, updates) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ).filter(item => item.quantity > 0);

    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await get().updateOrder(orderId, {
      items: updatedItems,
      totalAmount,
    });
  },

  removeOrderItem: async (orderId, itemId) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.filter(item => item.id !== itemId);
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await get().updateOrder(orderId, {
      items: updatedItems,
      total_amount : totalAmount,
    });
  },
}));

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,

  fetchPayments: async () => {
    try {
      set({ loading: true, error: null });
      const payments = await paymentService.getPayments();
      set({ payments });
    } catch (error) {
      set({ error: 'Failed to fetch payments' });
    } finally {
      set({ loading: false });
    }
  },

  addPayment: async (payment) => {
    try {
      set({ loading: true, error: null });
      const newPayment = await paymentService.createPayment(payment);
      set(state => ({ payments: [...state.payments, newPayment] }));
    } catch (error) {
      set({ error: 'Failed to add payment' });
    } finally {
      set({ loading: false });
    }
  },

  updatePaymentStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      const updatedPayment = await paymentService.updatePayment(id, { status });
      set(state => ({
        payments: state.payments.map(payment =>
          payment.id === id ? updatedPayment : payment
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update payment status' });
    } finally {
      set({ loading: false });
    }
  },

  getPaymentsByOrder: (orderId) => {
    return get().payments.filter(payment => payment.orderId === orderId);
  },
}));

