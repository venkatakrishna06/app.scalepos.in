// src/lib/services/websocket.service.ts

import { tokenService } from './token.service';
import { queryClient } from '../queryClient';
import { MenuItem, Order, Table } from '@/types';

/**
 * Types of messages that the server may send over the WebSocket.
 */
type WebSocketMessageType =
    | 'table_update'
    | 'order_update'
    | 'order_create'
    | 'menu_item_update'
    | 'order_item_status_update';

interface DeletedEntityData {
  id: number;
  deleted: true;
}

interface OrderItemStatusUpdateData {
  id: number;
  order_id: number;
  status: 'placed' | 'preparing' | 'served' | 'cancelled';
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
 *  • Parses incoming messages and invalidates the appropriate React Query caches.
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
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

      switch (message.type) {
        case 'table_update':
          this.handleTableUpdate(message.data as Table | DeletedEntityData);
          break;
        case 'order_create':
        case 'order_update':
          this.handleOrderUpdate(message.data as Order | DeletedEntityData);
          break;
        case 'menu_item_update':
          this.handleMenuItemUpdate(message.data as MenuItem | DeletedEntityData);
          break;
        case 'order_item_status_update':
          this.handleOrderItemStatusUpdate(
              message.data as OrderItemStatusUpdateData,
          );
          break;
        default:
          // Unknown message type – ignore for now
          break;
      }
    } catch {
      // Ignore JSON parse errors or unexpected message structures
    }
  }

  /**
   * Handle WebSocket close event and schedule reconnection if needed.
   */
  private handleClose(event: CloseEvent): void {
    this.socket = null;
    this.isConnecting = false;
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event.
   */
  private handleError(): void {
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt.
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
   * Handle a table update or deletion.
   * Invalidates every React Query cache whose key starts with 'tables'.
   */
  private handleTableUpdate(data: Table | DeletedEntityData): void {
    queryClient.invalidateQueries({
      predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'tables',
    });
  }

  /**
   * Handle an order creation or update.
   * Invalidates every React Query cache whose key starts with 'orders'.
   */
  private handleOrderUpdate(data: Order | DeletedEntityData): void {
    queryClient.invalidateQueries({
      predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'orders',
    });
  }

  /**
   * Handle a menu item update or deletion.
   * Invalidates every React Query cache whose key starts with 'menuItems'.
   */
  private handleMenuItemUpdate(data: MenuItem | DeletedEntityData): void {
    queryClient.invalidateQueries({
      predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'menuItems',
    });
  }

  /**
   * Handle an order item status update.
   * Invalidates the specific order detail and all order lists.
   */
  private handleOrderItemStatusUpdate(
      data: OrderItemStatusUpdateData,
  ): void {
    // First invalidate the specific order detail (if cached)
    queryClient.invalidateQueries({
      queryKey: ['orders', 'detail', data.order_id],
    });

    // Then invalidate every list of orders
    queryClient.invalidateQueries({
      predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'orders',
    });
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();
