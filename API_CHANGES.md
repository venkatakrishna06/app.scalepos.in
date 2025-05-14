# API Changes for Orders Endpoint

## Overview

The orders API endpoint has been updated to support filtering orders by period, date range, and table number. This document explains the changes made to the codebase to support these new API parameters.

## API Changes

### Default Behavior

If no date parameters are provided, the API returns orders for the current day.

### New Parameters

The API now supports the following parameters:

- `period`: Filter orders by a specific time period. Possible values are:
  - `day`: Returns orders for the current day (default)
  - `week`: Returns orders for the current week
  - `month`: Returns orders for the current month

- `start_date`: Filter orders from a specific start date (format: YYYY-MM-DD)
- `end_date`: Filter orders up to a specific end date (format: YYYY-MM-DD)
- `table_number`: Filter orders for a specific table

### Examples

#### Get Today's Orders

```javascript
// Using the order service directly
const todaysOrders = await orderService.getOrders();

// Using the order store
await orderStore.fetchOrders();
```

#### Get Current Week's Orders

```javascript
// Using the order service directly
const weekOrders = await orderService.getOrders({ period: 'week' });

// Using the order store
await orderStore.fetchOrders({ period: 'week' });
```

#### Get Current Month's Orders

```javascript
// Using the order service directly
const monthOrders = await orderService.getOrders({ period: 'month' });

// Using the order store
await orderStore.fetchOrders({ period: 'month' });
```

#### Get Orders for a Specific Date Range

```javascript
// Using the order service directly
const dateRangeOrders = await orderService.getOrders({
  start_date: '2023-01-01',
  end_date: '2023-01-31'
});

// Using the order store
await orderStore.fetchOrders({
  start_date: '2023-01-01',
  end_date: '2023-01-31'
});
```

#### Get Orders for a Specific Table on a Specific Date

```javascript
// Using the order service directly
const tableOrders = await orderService.getOrders({
  table_number: 5,
  start_date: '2023-01-15'
});

// Using the order store
await orderStore.fetchOrders({
  table_number: 5,
  start_date: '2023-01-15'
});
```

## Implementation Details

The following changes were made to support the new API parameters:

1. Updated `orderService.getOrders()` to accept parameters for period, date range, and table number
2. Updated `useOrderStore.fetchOrders()` to accept the same parameters and pass them to the service
3. Updated the Orders page to use the new parameters when filtering orders by timeframe
4. Ensured that by default, only the current day's orders are fetched throughout the application
   - Modified `orderService.getOrders()` to use `{ period: 'day' }` as the default if no parameters are provided
   - This ensures that all calls to `fetchOrders()` without parameters will only fetch the current day's orders

The Orders page now maps the UI filter timeframe values to the corresponding API parameters:
- 'today' maps to period='day'
- 'week' maps to period='week'
- 'month' maps to period='month'

This allows for more efficient server-side filtering of orders, reducing the amount of data transferred and improving performance. It also ensures that by default, the application only loads the data it needs, which further improves performance.

## Future Improvements

Future improvements could include:
- Adding UI controls for selecting custom date ranges
- Adding UI controls for filtering by table number
- Implementing pagination to further improve performance when dealing with large numbers of orders
