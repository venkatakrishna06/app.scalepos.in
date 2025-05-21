import {useEffect, useState} from 'react';
import {websocketService} from '@/lib/services/websocket.service';
import {useAuthStore} from '@/lib/store/auth.store';

/**
 * Hook for using WebSocket connection in components
 * 
 * This hook:
 * - Connects to the WebSocket server when the component mounts
 * - Disconnects from the WebSocket server when the component unmounts
 * - Provides a way to check the connection status
 * 
 * @returns An object with the connection status
 */
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Only connect if the user is authenticated
    if (!isAuthenticated) {
      return;
    }

    // Create a WebSocket connection
    const connect = () => {
      try {
        websocketService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        setIsConnected(false);
      }
    };

    // Connect to the WebSocket server
    connect();

    // Create a function to check the connection status periodically
    const checkConnection = () => {
      // This is a simple way to check if the connection is still active
      // In a real implementation, you might want to use a ping/pong mechanism
      const isConnected = websocketService.isConnected();
      setIsConnected(isConnected);

      // If not connected, try to reconnect
      if (!isConnected) {
        connect();
      }
    };

    // Check the connection status every 30 seconds
    const intervalId = setInterval(checkConnection, 30000);

    // Disconnect when the component unmounts
    return () => {
      clearInterval(intervalId);
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  return { isConnected };
};