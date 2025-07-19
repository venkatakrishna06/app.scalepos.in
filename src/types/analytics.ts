export interface SalesAnalytics {
    date: string;
    total_sales: number;
    total_orders: number;
    avg_order_value: number;
    total_tax: number;
    dine_in_sales: number;
    takeaway_sales: number;
    dine_in_orders: number;
    takeaway_orders: number;
    cancelled_orders: number;
}

export interface MenuItemAnalytics {
    menu_item_id: number;
    menu_item_name: string;
    category_id: number;
    category_name: string;
    quantity_sold: number;
    total_sales: number;
    cancellation_rate: number;
}

export interface StaffAnalytics {
    staff_id: number;
    staff_name: string;
    staff_role: string;
    orders_processed: number;
    total_sales: number;
    avg_order_value: number;
    orders_per_hour: number;
    avg_service_time: number;
}

export interface TableAnalytics {
    table_id: number;
    table_number: number;
    total_orders: number;
    total_sales: number;
    avg_order_value: number;
    avg_dining_time: number;
    turnover_rate: number;
    peak_usage_time: string;
}

export interface PaymentMethodAnalytics {
    payment_method: string;
    total_transactions: number;
    total_amount: number;
    percentage: number;
}

export interface HourlySalesAnalytics {
    hour: number;
    total_sales: number;
    total_orders: number;
    avg_order_value: number;
    day_of_week?: number;
}

export interface CustomerAnalytics {
    customer_id: number;
    customer_name: string;
    total_visits: number;
    total_spent: number;
    avg_order_value: number;
    last_visit: string;
    favorite_items: string[];
}

export interface AnalyticsParams {
    start_date?: string;
    end_date?: string;
    group_by?: 'day' | 'week' | 'month';
    category_id?: number;
    limit?: number;
    sort_by?: string;
    order?: 'asc' | 'desc';
    staff_id?: number;
    role?: string;
    table_id?: number;
    day_of_week?: number;
}