export interface MenuCategory {
  id: number;
  name: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: number;
  customer_id: number;
  table_id: number;
  staff_id: number;
  order_time: string;
  status: 'placed' | 'preparing' | 'served' | 'cancelled';
}

export interface RestaurantTable {
  id: number;
  table_number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

export interface Staff {
  id: number;
  name: string;
  role: 'waiter' | 'chef' | 'manager' | 'cashier';
  phone: string;
  shift_start: string;
  shift_end: string;
}

export interface UserAccount {
  id: number;
  staff_id: number;
  username: string;
  role: 'admin' | 'counter' | 'server';
  is_active: boolean;
}

export interface TableAssignment {
  id: number;
  staff_id: number;
  table_id: number;
  assigned_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount_paid: number;
  payment_method: 'cash' | 'card' | 'upi' | 'wallet';
  paid_at: string;
}

export interface Reservation {
  id: number;
  customer_id: number;
  table_id: number;
  reserved_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}