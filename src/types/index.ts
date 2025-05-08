export interface Category {
  parent_category_id: number | undefined;
  mainCategory: string;
  id: number;
  name: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Category; // Matches backend Category
  category_id: number; // Matches backend CategoryID
  image?: string;
  available?: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string; // Matches backend CreatedAt
}

export interface OrderItem {
  id: number; // Matches backend ID
  order_id: number; // Matches backend OrderID
  menu_item_id: number; // Matches backend MenuItemID
  quantity: number;
  status: 'placed' | 'preparing' | 'served' | 'cancelled';
  notes: string; // Matches backend Notes
  price?: number; // For UI calculations
  name?: string; // For UI display
}

export interface Order {
  id: number;
  customer_id: number; // Matches backend CustomerID
  table_id: number; // Matches backend TableID
  staff_id: number; // Matches backend StaffID
  order_time: string; // Matches backend OrderTime
  status: 'placed' | 'preparing' | 'served' | 'cancelled' | 'paid';
  items: OrderItem[];
  total_amount?: number;
  customer?: string;
  server?: string;
  payment_method?: string;
}

export interface Table {
  id: number;
  table_number: number; // Matches backend table_number
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: number;
  merged_with?: number[];
  split_from?: number;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  phone: string;
  shift: string;
  status?: 'active' | 'inactive';
}

export interface Payment {
  id: number;
  order_id: number; // Matches backend OrderID
  amount_paid: number; // Matches backend amount_paid
  payment_method: 'cash' | 'card';
  paid_at: string; // Matches backend paid_at
  status?: 'completed' | 'pending' | 'failed';
}

export interface Reservation {
  id: number;
  customer_id: number; // Matches backend CustomerID
  table_id: number; // Matches backend TableID
  reserved_at: string; // Matches backend reserved_at
  status: 'pending' | 'confirmed' | 'cancelled';
  customer_name?: string;
  phone?: string;
  guests?: number;
}