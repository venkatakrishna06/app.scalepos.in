export interface Category {
    parent_category_id: number | undefined;
    id: number;
    name: string;
    include_in_gst?: boolean;
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
    include_in_gst?: boolean;
}

export interface Customer {
    id: number;
    restaurant_id: number;
    name: string;
    phone: string;
    email: string;
    address?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: number;
    restaurant_id: number;
    order_id: number;
    menu_item_id: number;
    quantity: number;
    status: 'placed' | 'preparing' | 'served' | 'cancelled' | "ready";
    notes: string;
    price: number;
    name: string;
    include_in_gst?: boolean;
    allowed_next_states?: string[]; // Added for state machine support
}

export interface Order {
    id: number;
    restaurant_id: number;
    customer_id?: number;
    table_id: number;
    staff_id: number;
    order_time: string;
    status: 'placed' | 'preparing' | 'served' | 'cancelled' | 'paid' | 'partially-cancelled';
    order_type: 'dine-in' | 'takeaway' | 'quick-bill';
    sub_total: number;
    sgst_rate: number;
    cgst_rate: number;
    sgst_amount: number;
    cgst_amount: number;
    total_amount: number;
    items: OrderItem[];
    table?: Table;
    server?: string;
    customer?: string;
    payment_method?: string;
    token_number?: string;
    allowed_next_states?: string[]; // Added for state machine support
}

export interface Table {
    id: number;
    restaurant_id: number;
    table_number: number;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning';
    location?: string;
    current_order_id?: number;
    merged_with?: number[];
    split_from?: number;
}

export interface StaffMember {
    id: number;
    restaurant_id: number;
    name: string;
    role: string;
    phone: string;
    shift: string;
    status: 'active' | 'inactive';
}

export interface Payment {
    status: any;
    paid_at: string | number | Date;
    amount_paid: any;
    id: number;
    restaurant_id: number;
    order_id: number;
    amount: number;
    payment_method: 'cash' | 'card' | 'upi';
    payment_status: 'completed' | 'pending' | 'failed';
    transaction_id?: string;
    card_details?: {
        last_four?: string;
        card_type?: string;
    };
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

export interface Restaurant {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    gst_number: string;
    is_active: boolean;
    default_sgst_rate: number;
    default_cgst_rate: number;
    enable_order_status_tracking: boolean;
}

export interface User {
    id: number;
    restaurant_id: number;
    staff_id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    staff?: StaffMember;
    restaurant?: Restaurant;
}
