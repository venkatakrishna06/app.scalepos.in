// src/lib/services/websocket.service.ts
import { tokenService } from './token.service';
import { queryClient } from '../queryClient';
import { MenuItem, Order, OrderItem, Table } from '@/types';

/**
 * Types of messages that the server may send over the WebSocket.
 */
type WebSocketMessageType =
  | 'table_update'
  | 'order_update'
  | 'order_create'
  | 'menu_item_update'
  | 'order_item_update'
  | 'order_item_status_update';

interface DeletedEntityData {
  id: number;
  deleted: true;
}

interface OrderItemStatusUpdateData {
  id: number;
  order_id: number;
  status: 'placed' | 'preparing'|'ready' | 'served'  |'cancelled';
}

interface WebSocketMessage<
  T = Table | Order | MenuItem | DeletedEntityData | OrderItemStatusUpdateData,
> {
  type: WebSocketMessageType;
  data: T;
  restaurant_id: number;
}

/**
 * WebSocket service for handling real-time updates using React Query.
 *
 * This service:
 *  • Establishes an authenticated WebSocket connection.
 *  • Handles reconnection when the socket closes unexpectedly.
 *  • Parses incoming messages and updates the appropriate React Query caches.
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isConnecting = false;

  /**
   * Initialize the WebSocket connection.
   */
  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return; // Already connected or connecting
    }
    this.isConnecting = true;
    const token = tokenService.getToken();
    if (!token) {
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
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect the WebSocket.
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
   * Check if the WebSocket is connected.
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event.
   * Sends an authenticate message to the server.
   */
  private handleOpen(): void {
    console.log('WebSocket connection established.');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    const token = tokenService.getToken();
    if (token && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'authenticate', token }));
    }
  }

  /**
   * Parse the incoming message and route it to the appropriate handler.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log('Received WebSocket message:', message);
      switch (message.type) {
        case 'table_update':
          this.handleTableUpdate(message.data as Table | DeletedEntityData);
          break;
        case 'order_create':
        case 'order_update':
          this.handleOrderUpdate(message.data as Order | DeletedEntityData);
          break;
        case 'order_item_update':
          this.handleOrderUpdate(message.data as OrderItem);
          break;
        case 'menu_item_update':
          this.handleMenuItemUpdate(
            message.data as MenuItem | DeletedEntityData,
          );
          break;
        case 'order_item_status_update':
          this.handleOrderItemStatusUpdate(
            message.data as OrderItemStatusUpdateData,
          );
          break;
        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event and schedule reconnection if needed.
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.reason);
    this.socket = null;
    this.isConnecting = false;
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event.
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket max reconnect attempts reached.');
      return;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`WebSocket reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Handle a table update or deletion.
   * Updates the React Query cache for tables.
   */
  private handleTableUpdate(data: Table | DeletedEntityData): void {
    const queryKey = ['tables'];
    queryClient.setQueriesData({ queryKey }, (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData;

      if ('deleted' in data && data.deleted) {
        return oldData.filter((table: Table) => table.id !== data.id);
      } else {
        const tableData = data as Table;
        const index = oldData.findIndex((table: Table) => table.id === tableData.id);
        if (index !== -1) {
          const newArray = [...oldData];
          newArray[index] = tableData;
          return newArray;
        } else {
          return [...oldData, tableData];
        }
      }
    });

    queryClient.invalidateQueries({ queryKey });
  }

  /**
   * Handle an order creation or update.
   * Updates the React Query cache for orders.
   */
  private handleOrderUpdate(data: Order | OrderItem | DeletedEntityData): void {
    const queryKey = ['orders'];
    queryClient.setQueriesData({ queryKey }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;

        if ('deleted' in data && data.deleted) {
            return oldData.filter((order: Order) => order.id !== data.id);
        } else if ('order_id' in data) {
            // This is an OrderItem, not an Order
            const orderItem = data as OrderItem;
            console.log('Received OrderItem update:', orderItem);
            
            // Find the parent order and update the item within it
            return oldData.map((order: Order) => {
                if (order.id === orderItem.order_id) {
                    const updatedItems = order.items.map(item => 
                        item.id === orderItem.id ? orderItem : item
                    );
                    return { ...order, items: updatedItems };
                }
                return order;
            });
        } else {
            // This is a complete Order
            const orderData = data as Order;
            const index = oldData.findIndex((order: Order) => order.id === orderData.id);
            if (index !== -1) {
                const newArray = [...oldData];
                newArray[index] = orderData;
                return newArray;
            } else {
                return [...oldData, orderData];
            }
        }
    });
    queryClient.invalidateQueries({ queryKey });
  }

  /**
   * Handle a menu item update or deletion.
   * Updates the React Query cache for menu items.
   */
  private handleMenuItemUpdate(data: MenuItem | DeletedEntityData): void {
    const queryKey = ['menuItems'];
    queryClient.setQueriesData({ queryKey }, (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData;

      if ('deleted' in data && data.deleted) {
        return oldData.filter((item: MenuItem) => item.id !== data.id);
      } else {
        const menuItemData = data as MenuItem;
        const index = oldData.findIndex((item: MenuItem) => item.id === menuItemData.id);
        if (index !== -1) {
            const newArray = [...oldData];
            newArray[index] = menuItemData;
            return newArray;
        } else {
            return [...oldData, menuItemData];
        }
      }
    });
    queryClient.invalidateQueries({ queryKey });
  }

  /**
   * Handle an order item status update.
   * Invalidates the specific order detail and all order lists.
   */
  private handleOrderItemStatusUpdate(
    data: OrderItemStatusUpdateData,
  ): void {
    const queryKey = ['orders'];
    queryClient.setQueriesData({ queryKey }, (oldData: any): any => {
      if (!Array.isArray(oldData)) return oldData;

      return oldData.map((order: Order) => {
        if (order.id === data.order_id) {
          const newItems = order.items.map(item => {
            if (item.id === data.id) {
              return { ...item, status: data.status };
            }
            return item;
          });
          return { ...order, items: newItems };
        }
        return order;
      });
    });
    queryClient.invalidateQueries({ queryKey });
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();
