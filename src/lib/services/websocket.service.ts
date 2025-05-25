import {tokenService} from './token.service';
import {useRootStore} from '../store/root.store';
import {useTableStore} from '../store/table.store';
import {useOrderStore} from '../store/order.store';
import {useMenuStore} from '../store/menu.store';
import {useNotificationStore} from '../store/notification.store';
import {MenuItem, Order, Table} from '@/types';

// Define types for WebSocket messages
type WebSocketMessageType = 'table_update' | 'order_update' | 'menu_item_update' | 'order_item_status_update';

interface DeletedEntityData {
  id: number;
  deleted: true;
}

interface OrderItemStatusUpdateData {
  id: number;
  order_id: number;
  status: 'placed' | 'preparing' | 'served' | 'cancelled';
}

interface WebSocketMessage<T = Table | Order | MenuItem | DeletedEntityData | OrderItemStatusUpdateData> {
  type: WebSocketMessageType;
  data: T;
  restaurant_id: number;
}

// Define a type for the root store state
interface RootStoreState {
  tableStore: {
    tables: Table[];
    [key: string]: unknown;
  };
  orderStore: {
    orders: Order[];
    [key: string]: unknown;
  };
  menuStore: {
    menuItems: MenuItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * WebSocket service for handling real-time updates
 * 
 * This service manages:
 * - WebSocket connection establishment and authentication
 * - Reconnection logic
 * - Message handling for different entity types (tables, orders, menu items)
 * - Integration with the application state management
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isConnecting = false;

  /**
   * Initialize the WebSocket connection
   */
  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return; // Already connected or connecting
    }

    this.isConnecting = true;
    const token = tokenService.getToken();

    if (!token) {
      console.error('Cannot connect to WebSocket: No authentication token available');
      this.isConnecting = false;
      return;
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseURL = baseURL.replace(/^https?:/, wsProtocol);
    const wsURL = `${wsBaseURL}/ws?token=${token}`;

    try {
      this.socket = new WebSocket(wsURL);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect the WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Check if the WebSocket is connected
   * @returns True if the WebSocket is connected, false otherwise
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;

      // Log the received WebSocket message
      console.log('WebSocket message received:', message);

      // Get the root store to access individual stores
      const rootStore = useRootStore.getState() as RootStoreState;

      switch (message.type) {
        case 'table_update':
          this.handleTableUpdate(message.data, rootStore);
          break;
        case 'order_update':
          this.handleOrderUpdate(message.data, rootStore);
          break;
        case 'menu_item_update':
          this.handleMenuItemUpdate(message.data, rootStore);
          break;
        case 'order_item_status_update':
          this.handleOrderItemStatusUpdate(message.data, rootStore);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected', event.code, event.reason);
    this.socket = null;
    this.isConnecting = false;

    // Only attempt to reconnect if it wasn't a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Handle table update message
   */
  private handleTableUpdate(data: Table | DeletedEntityData, rootStore: RootStoreState): void {
    const tableStore = rootStore.tableStore;

    // Log the table update data
    console.log('Processing table update:', data);

    if ('deleted' in data && data.deleted) {
      // Handle table deletion
      console.log('Table deleted:', data.id);
      const tables = tableStore.tables.filter((table: Table) => table.id !== data.id);

      // Update both the root store and the table store directly
      useRootStore.setState({tableStore: {...tableStore, tables}});
      useTableStore.setState({tables});


      // Add notification
      useNotificationStore.getState().addNotification({
        type: 'table_update',
        message: `Table ${data.id} has been deleted`,
        entityId: data.id,
      });
    } else {
      // Handle table creation or update
      const tableData = data as Table;
      const existingTableIndex = tableStore.tables.findIndex((table: Table) => table.id === tableData.id);

      if (existingTableIndex >= 0) {
        // Update existing table
        console.log('Updating existing table:', tableData);
        const updatedTables = [...tableStore.tables];
        updatedTables[existingTableIndex] = tableData;

        // Update both the root store and the table store directly
        useRootStore.setState({tableStore: {...tableStore, tables: updatedTables}});
        useTableStore.setState({tables: updatedTables});


        // Add notification
        useNotificationStore.getState().addNotification({
          type: 'table_update',
          message: `Table ${tableData.table_number} has been updated`,
          details: `Status: ${tableData.status}`,
          entityId: tableData.id,
        });
      } else {
        // Add new table
        console.log('Adding new table:', tableData);
        const newTables = [...tableStore.tables, tableData];

        // Update both the root store and the table store directly
        useRootStore.setState({
          tableStore: {
            ...tableStore,
            tables: newTables
          }
        });
        useTableStore.setState({tables: newTables});


        // Add notification
        useNotificationStore.getState().addNotification({
          type: 'table_update',
          message: `New table ${tableData.table_number} has been added`,
          details: `Capacity: ${tableData.capacity}`,
          entityId: tableData.id,
        });
      }
    }
  }

  /**
   * Handle order update message
   */
  private handleOrderUpdate(data: Order | DeletedEntityData, rootStore: RootStoreState): void {
    const orderStore = rootStore.orderStore;

    // Log the order update data
    console.log('Processing order update:', data);

    if ('deleted' in data && data.deleted) {
      // Handle order deletion
      console.log('Order deleted:', data.id);
      const orders = orderStore.orders.filter((order: Order) => order.id !== data.id);

      // Update both the root store and the order store directly
      useRootStore.setState({orderStore: {...orderStore, orders}});
      useOrderStore.setState({orders});


      // Add notification
      useNotificationStore.getState().addNotification({
        type: 'order_update',
        message: `Order #${data.id} has been deleted`,
        entityId: data.id,
      });
    } else {
      // Handle order creation or update
      const orderData = data as Order;
      const existingOrderIndex = orderStore.orders.findIndex((order: Order) => order.id === orderData.id);

      if (existingOrderIndex >= 0) {
        // Update existing order
        console.log('Updating existing order:', orderData);
        const updatedOrders = [...orderStore.orders];
        updatedOrders[existingOrderIndex] = orderData;

        // Update both the root store and the order store directly
        useRootStore.setState({orderStore: {...orderStore, orders: updatedOrders}});
        useOrderStore.setState({orders: updatedOrders});


        // Add notification
        useNotificationStore.getState().addNotification({
          type: 'order_update',
          message: `Order #${orderData.id} has been updated`,
          details: `Status: ${orderData.status}`,
          entityId: orderData.id,
        });
      } else {
        // Add new order
        console.log('Adding new order:', orderData);
        const newOrders = [...orderStore.orders, orderData];

        // Update both the root store and the order store directly
        useRootStore.setState({
          orderStore: {
            ...orderStore,
            orders: newOrders
          }
        });
        useOrderStore.setState({orders: newOrders});

        // Update cache
        cacheService.setCache(CACHE_KEYS.ORDERS, newOrders);

        // Add notification
        useNotificationStore.getState().addNotification({
          type: 'order_update',
          message: `New order #${orderData.id} has been created`,
          details: `Total: ${orderData.total_amount.toFixed(2)}`,
          entityId: orderData.id,
        });
      }
    }
  }

  /**
   * Handle menu item update message
   */
  private handleMenuItemUpdate(data: MenuItem | DeletedEntityData, rootStore: RootStoreState): void {
    const menuStore = rootStore.menuStore;

    // Log the menu item update data
    console.log('Processing menu item update:', data);

    if ('deleted' in data && data.deleted) {
      // Handle menu item deletion
      console.log('Menu item deleted:', data.id);
      const menuItems = menuStore.menuItems.filter((item: MenuItem) => item.id !== data.id);

      // Update both the root store and the menu store directly
      useRootStore.setState({menuStore: {...menuStore, menuItems}});
      useMenuStore.setState({menuItems});

      // Update cache
      cacheService.setCache(CACHE_KEYS.MENU_ITEMS, menuItems);

      // Add notification
      useNotificationStore.getState().addNotification({
        type: 'menu_item_update',
        message: `Menu item #${data.id} has been deleted`,
        entityId: data.id,
      });
    } else {
      // Handle menu item creation or update
      const menuItemData = data as MenuItem;
      const existingItemIndex = menuStore.menuItems.findIndex((item: MenuItem) => item.id === menuItemData.id);

      if (existingItemIndex >= 0) {
        // Update existing menu item
        console.log('Updating existing menu item:', menuItemData);
        const updatedMenuItems = [...menuStore.menuItems];
        updatedMenuItems[existingItemIndex] = menuItemData;

        // Update both the root store and the menu store directly
        useRootStore.setState({menuStore: {...menuStore, menuItems: updatedMenuItems}});
        useMenuStore.setState({menuItems: updatedMenuItems});

        // Update cache
        cacheService.setCache(CACHE_KEYS.MENU_ITEMS, updatedMenuItems);

        // Add notification
        useNotificationStore.getState().addNotification({
          type: 'menu_item_update',
          message: `Menu item "${menuItemData.name}" has been updated`,
          details: `Price: ${menuItemData.price.toFixed(2)}`,
          entityId: menuItemData.id,
        });
      } else {
        // Add new menu item
        console.log('Adding new menu item:', menuItemData);
        const newMenuItems = [...menuStore.menuItems, menuItemData];

        // Update both the root store and the menu store directly
        useRootStore.setState({
          menuStore: {
            ...menuStore,
            menuItems: newMenuItems
          }
        });
        useMenuStore.setState({menuItems: newMenuItems});

        // Update cache
        cacheService.setCache(CACHE_KEYS.MENU_ITEMS, newMenuItems);

        // Add notification
        useNotificationStore.getState().addNotification({
          type: 'menu_item_update',
          message: `New menu item "${menuItemData.name}" has been added`,
          details: `Price: ${menuItemData.price.toFixed(2)}`,
          entityId: menuItemData.id,
        });
      }
    }
  }
    /**
     * Handle order item status update message
     */
    private handleOrderItemStatusUpdate(data: OrderItemStatusUpdateData, rootStore: RootStoreState): void {
      const orderStore = rootStore.orderStore;

        // Log the order item status update data
        console.log('Processing order item status update:', data);

        // Find the order and update the status of the specific item
        const orderIndex = orderStore.orders.findIndex((order: Order) => order.id === data.order_id);
        if (orderIndex >= 0) {
            const updatedOrders = [...orderStore.orders];
            const order = updatedOrders[orderIndex];

            const itemIndex = order.items.findIndex((item) => item.id === data.id);
            if (itemIndex >= 0) {
                const item = order.items[itemIndex];
                const oldStatus = item.status;
                item.status = data.status;
                updatedOrders[orderIndex] = order;

                // Update both the root store and the order store directly
                useRootStore.setState({orderStore: {...orderStore, orders: updatedOrders}});
                useOrderStore.setState({orders: updatedOrders});

                // Update cache
                cacheService.setCache(CACHE_KEYS.ORDERS, updatedOrders);

                // Add notification
                useNotificationStore.getState().addNotification({
                  type: 'order_item_status_update',
                  message: `Order #${order.id} item status changed`,
                  details: `${item.name} changed from ${oldStatus} to ${data.status}`,
                  entityId: order.id,
                });
            }
        }
    }

}

// Create a singleton instance
export const websocketService = new WebSocketService();
