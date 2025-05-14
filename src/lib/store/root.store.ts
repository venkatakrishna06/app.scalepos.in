import {create} from 'zustand';
import {useStaffStore} from './staff.store';
import {useMenuStore} from './menu.store';
import {useTableStore} from './table.store';
import {useOrderStore} from './order.store';
import {usePaymentStore} from './payment.store';
import {useUserStore} from './user.store';
import {useRestaurantStore} from './restaurant.store';
import {useAuthStore} from './auth.store';
import {useAnalyticsStore} from './analytics.store';

/**
 * Root store that combines all stores
 * 
 * This store provides a clean way to access all stores in one place
 * and enables proper store composition.
 * 
 * Example usage:
 * ```
 * const { menuStore, orderStore } = useRootStore();
 * const menuItems = menuStore.menuItems;
 * const orders = orderStore.orders;
 * ```
 */
export const useRootStore = create(() => ({
  // Store references
  staffStore: useStaffStore.getState(),
  menuStore: useMenuStore.getState(),
  tableStore: useTableStore.getState(),
  orderStore: useOrderStore.getState(),
  paymentStore: usePaymentStore.getState(),
  userStore: useUserStore.getState(),
  restaurantStore: useRestaurantStore.getState(),
  authStore: useAuthStore.getState(),
  analyticsStore: useAnalyticsStore.getState(),

  // Subscribe to store changes
  subscribeToStores: () => {
    // Subscribe to each store to keep the root store updated
    const unsubscribeStaff = useStaffStore.subscribe(
      state => useRootStore.setState({ staffStore: state })
    );

    const unsubscribeMenu = useMenuStore.subscribe(
      state => useRootStore.setState({ menuStore: state })
    );

    const unsubscribeTable = useTableStore.subscribe(
      state => useRootStore.setState({ tableStore: state })
    );

    const unsubscribeOrder = useOrderStore.subscribe(
      state => useRootStore.setState({ orderStore: state })
    );

    const unsubscribePayment = usePaymentStore.subscribe(
      state => useRootStore.setState({ paymentStore: state })
    );

    const unsubscribeUser = useUserStore.subscribe(
      state => useRootStore.setState({ userStore: state })
    );

    const unsubscribeRestaurant = useRestaurantStore.subscribe(
      state => useRootStore.setState({ restaurantStore: state })
    );

    const unsubscribeAuth = useAuthStore.subscribe(
      state => useRootStore.setState({ authStore: state })
    );

    const unsubscribeAnalytics = useAnalyticsStore.subscribe(
      state => useRootStore.setState({ analyticsStore: state })
    );

    // Return unsubscribe function
    return () => {
      unsubscribeStaff();
      unsubscribeMenu();
      unsubscribeTable();
      unsubscribeOrder();
      unsubscribePayment();
      unsubscribeUser();
      unsubscribeRestaurant();
      unsubscribeAuth();
      unsubscribeAnalytics();
    };
  }
}));

// Initialize subscriptions
useRootStore.getState().subscribeToStores();
