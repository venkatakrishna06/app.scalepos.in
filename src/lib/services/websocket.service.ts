import { tokenService } from './token.service';
import { toast } from '@/lib/toast';

// Define event types
export type WebSocketEventType = 'order_created' | 'order_updated' | 'order_deleted' | 'order_status_changed';

// Define event data interface
export interface WebSocketEvent {
  type: WebSocketEventType;
  data: {
    order?: Order;
    orderId?: number;
    status?: string;
    [key: string]: unknown;
  };
}

// Import Order type
import { Order } from '@/types';

// Define event handler type
export type WebSocketEventHandler = (event: WebSocketEvent) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private eventHandlers: Map<WebSocketEventType, WebSocketEventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimeoutId: number | null = null;
  private isConnecting = false;

  // Connect to the WebSocket server
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    // Get the API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error('API URL not found in environment variables');
      this.isConnecting = false;
      return;
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // Add an event handler
  on(eventType: WebSocketEventType, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType);
    if (handlers && !handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  // Remove an event handler
  off(eventType: WebSocketEventType, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Handle WebSocket open event
  private handleOpen(): void {
    // Use console.info for informational messages in production
    console.info('WebSocket connection established');
    this.reconnectAttempts = 0;
    this.isConnecting = false;

    // Send authentication token
    const token = tokenService.getToken();
    if (token && this.socket) {
      this.socket.send(JSON.stringify({ type: 'authenticate', token }));
    }
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const wsEvent = JSON.parse(event.data) as WebSocketEvent;
      
      // Dispatch event to registered handlers
      const handlers = this.eventHandlers.get(wsEvent.type);
      if (handlers) {
        handlers.forEach(handler => handler(wsEvent));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.info(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
    // Attempt to reconnect on error
    this.scheduleReconnect();
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      
      console.info(`Scheduling WebSocket reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimeoutId = window.setTimeout(() => {
        this.reconnectTimeoutId = null;
        this.connect();
      }, delay);
    } else {
      console.error(`Maximum WebSocket reconnection attempts (${this.maxReconnectAttempts}) reached`);
      // Notify the user that real-time updates are not available
      toast.error('Real-time order updates are currently unavailable. Please refresh the page manually.');
    }
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService();