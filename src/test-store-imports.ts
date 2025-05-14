// Test file to check if store imports work correctly without circular dependencies
import {useOrderStore} from './lib/store/order.store';
import {usePaymentStore} from './lib/store/payment.store';
import {useRootStore} from './lib/store/root.store';

// Get store states
const orderStore = useOrderStore.getState();
const paymentStore = usePaymentStore.getState();
const rootStore = useRootStore.getState();

// Log some values to verify everything works
console.log('Order store initialized:', !!orderStore);
console.log('Payment store initialized:', !!paymentStore);
console.log('Root store initialized:', !!rootStore);

// Test accessing methods
console.log('Order store methods:', Object.keys(orderStore));
console.log('Payment store methods:', Object.keys(paymentStore));
console.log('Root store properties:', Object.keys(rootStore));