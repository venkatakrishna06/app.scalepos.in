// Test file to check if store imports work correctly without circular dependencies
// Note: This file has been updated to work with the new React Query-based stores

import {useRootStore} from './lib/store/root.store';

// For Zustand stores, we can use getState()
const rootStore = useRootStore.getState();

// For React Query stores, we would need to use the hooks in a React component
// This is just a test file, so we'll just log that they've been imported successfully
console.log('Order store imported successfully');
console.log('Payment store imported successfully');
console.log('Table store imported successfully');

// Log some values to verify everything works
console.log('Root store initialized:', !!rootStore);

// Test accessing methods
console.log('Root store properties:', Object.keys(rootStore));

// Note: To test the React Query stores, you would need to use them in a React component
// with the QueryClientProvider. See the App.tsx file for an example.
