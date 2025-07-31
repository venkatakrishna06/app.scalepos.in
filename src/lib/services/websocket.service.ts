import {tokenService} from './token.service';
import {queryClient} from '../queryClient';
import {MenuItem, Order, Table} from '@/types';

// Define types for WebSocket messages
type WebSocketMessageType = 'table_update' | 'order_update' | 'menu_item_update' | 'order_item_status_update';

interface DeletedEntityData {
  id: number;
  deleted: true;
}

interface OrderItemStatusUpdateData {
  id:number;
  order_id: number;
  status: 'placed' | 'preparing' | 'served' | 'cancelled';
}

interface WebSocketMessage<T = Table | Order | MenuItem | DeletedEntityData | OrderItemStatusUpdateData> {
  type: WebSocketMessageType;
  data: T;
  restaurant_id: number;
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

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;

      switch (message.type) {
        case 'table_update':
          this.handleTableUpdate(message.data as Table | DeletedEntityData);
          break;
        case 'order_update':
          this.handleOrderUpdate(message.data as Order | DeletedEntityData);
          break;
        case 'menu_item_update':
          this.handleMenuItemUpdate(message.data as MenuItem | DeletedEntityData);
          break;
        case 'order_item_status_update':
          this.handleOrderItemStatusUpdate(message.data as OrderItemStatusUpdateData);
          break;
        default:

      }
    } catch (error) {

    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {

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

    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {

      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {

      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Handle table update message
   */
  private handleTableUpdate(data: Table | DeletedEntityData): void {
    queryClient.invalidateQueries({queryKey: ['tables']});
  }

  /**
   * Handle order update message
   */
  private handleOrderUpdate(data: Order | DeletedEntityData): void {
    queryClient.invalidateQueries({queryKey: ['orders']});
  }

  /**
   * Handle menu item update message
   */
  private handleMenuItemUpdate(data: MenuItem | DeletedEntityData): void {
    queryClient.invalidateQueries({queryKey: ['menu', 'items']});
  }

  /**
   * Handle order item status update message
   */
  private handleOrderItemStatusUpdate(data: OrderItemStatusUpdateData): void {
    queryClient.invalidateQueries({queryKey: ['orders']});
  }

}

// Create a singleton instance
export const websocketService = new WebSocketService();
