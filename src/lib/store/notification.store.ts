import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'table_update' | 'order_update' | 'menu_item_update' | 'order_item_status_update';
  message: string;
  details?: string;
  timestamp: number;
  read: boolean;
  entityId: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50 notifications
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) => 
            notification.id === id ? { ...notification, read: true } : notification
          );

          return {
            notifications: updatedNotifications,
            unreadCount: state.unreadCount - 1 >= 0 ? state.unreadCount - 1 : 0,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);
