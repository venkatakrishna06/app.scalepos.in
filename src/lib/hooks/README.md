# React Query Hooks

This directory contains React Query hooks for data fetching and state management. These hooks replace the Zustand stores
and provide a more declarative and efficient way to manage server state.

## Features

- **Data Fetching**: Fetch data from the server with automatic caching and refetching.
- **Mutations**: Update data on the server with automatic cache invalidation.
- **Persistence**: Cache is persisted to localStorage to survive page refreshes.
- **Error Handling**: Errors are handled gracefully with toast notifications.
- **Loading States**: Loading states are tracked automatically.

## Available Hooks

### useAuth

Authentication-related operations:

```tsx
import { useAuth } from '@/lib/hooks';

const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isAuthLoading, 
    login, 
    signup, 
    logout, 
    updateProfile, 
    changePassword 
  } = useAuth();

  // Example: Login
  const handleLogin = () => {
    login({ email: 'user@example.com', password: 'password', rememberMe: true });
  };

  return (
    <div>
      {isAuthLoading ? (
        <p>Loading...</p>
      ) : isAuthenticated ? (
        <p>Welcome, {user?.name}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

### useOrder

Order-related operations:

```tsx
import { useOrder } from '@/lib/hooks';

const OrdersComponent = () => {
  const { useOrdersQuery, createOrder } = useOrder();
  const { data: orders, isLoading } = useOrdersQuery();

  // Example: Create order
  const handleCreateOrder = () => {
    createOrder({
      table_id: 1,
      items: [],
      status: 'pending',
      // ... other order properties
    });
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading orders...</p>
      ) : (
        <ul>
          {orders?.map(order => (
            <li key={order.id}>{order.id}</li>
          ))}
        </ul>
      )}
      <button onClick={handleCreateOrder}>Create Order</button>
    </div>
  );
};
```

### useMenu

Menu-related operations:

```tsx
import { useMenu } from '@/lib/hooks';

const MenuComponent = () => {
  const { useMenuItemsQuery, useCategoriesQuery, createItem } = useMenu();
  const { data: menuItems, isLoading: isLoadingItems } = useMenuItemsQuery();
  const { data: categories, isLoading: isLoadingCategories } = useCategoriesQuery();

  // Example: Create menu item
  const handleCreateItem = () => {
    createItem({
      name: 'New Item',
      price: 10.99,
      category_id: 1,
      // ... other item properties
    });
  };

  return (
    <div>
      {isLoadingItems || isLoadingCategories ? (
        <p>Loading menu data...</p>
      ) : (
        <div>
          <h2>Categories</h2>
          <ul>
            {categories?.map(category => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
          <h2>Menu Items</h2>
          <ul>
            {menuItems?.map(item => (
              <li key={item.id}>{item.name} - ${item.price}</li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={handleCreateItem}>Add Menu Item</button>
    </div>
  );
};
```

### useTable

Table-related operations:

```tsx
import { useTable } from '@/lib/hooks';

const TablesComponent = () => {
  const { useTablesQuery, createTable, updateTable, deleteTable } = useTable();
  const { data: tables, isLoading } = useTablesQuery();

  // Example: Create table
  const handleCreateTable = () => {
    createTable({
      number: 5,
      capacity: 4,
      status: 'available',
    });
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading tables...</p>
      ) : (
        <ul>
          {tables?.map(table => (
            <li key={table.id}>
              Table {table.number} - {table.status}
              <button onClick={() => updateTable({ id: table.id, table: { status: 'occupied' } })}>
                Mark as Occupied
              </button>
              <button onClick={() => deleteTable(table.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleCreateTable}>Add Table</button>
    </div>
  );
};
```

### usePayment

Payment-related operations:

```tsx
import { usePayment } from '@/lib/hooks';

const PaymentsComponent = () => {
  const { usePaymentsQuery, usePaymentsByOrderQuery, createPayment } = usePayment();
  const { data: payments, isLoading } = usePaymentsQuery();

  // Example: Create payment
  const handleCreatePayment = () => {
    createPayment({
      order_id: 1,
      amount: 50.99,
      payment_method: 'cash',
      // ... other payment properties
    });
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading payments...</p>
      ) : (
        <ul>
          {payments?.map(payment => (
            <li key={payment.id}>
              Payment #{payment.id} - ${payment.amount} ({payment.payment_method})
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleCreatePayment}>Add Payment</button>
    </div>
  );
};
```

## Migration from Zustand Stores

To migrate from Zustand stores to React Query hooks:

1. Import the appropriate hook from `@/lib/hooks` instead of the Zustand store.
2. Replace store selectors with hook return values.
3. Replace store actions with hook mutations.
4. Use the query functions for data fetching.

### Example Migration

**Before (with Zustand):**

```tsx
import { useAuthStore } from '@/lib/store/auth.store';

const LoginComponent = () => {
  const { login, loading, error } = useAuthStore(state => ({
    login: state.login,
    loading: state.loading,
    error: state.error
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password, rememberMe);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading}>Login</button>
    </form>
  );
};
```

**After (with React Query):**

```tsx
import { useAuth } from '@/lib/hooks';

const LoginComponent = () => {
  const { login, isLoginLoading, loginError } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, password, rememberMe });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {isLoginLoading && <p>Loading...</p>}
      {loginError && <p>{loginError.message}</p>}
      <button type="submit" disabled={isLoginLoading}>Login</button>
    </form>
  );
};
```