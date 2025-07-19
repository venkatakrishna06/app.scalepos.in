import {z} from 'zod';

/**
 * Zod schemas for API response validation
 *
 * These schemas help ensure that API responses match expected types
 * and provide helpful error messages when they don't.
 */

// Base schemas for common properties
const idSchema = z.number().int().positive();
const timestampSchema = z.string().datetime();
const priceSchema = z.number().nonnegative();

// Order item schema
export const orderItemSchema = z.object({
    id: idSchema,
    order_id: idSchema,
    menu_item_id: idSchema,
    name: z.string(),
    price: priceSchema,
    quantity: z.number().int().positive(),
    status: z.enum(['placed', 'preparing', 'ready', 'served', 'cancelled']),
    notes: z.string().optional().nullable(),
    include_in_gst: z.boolean().optional().default(true),
    allowed_next_states: z.array(z.string()).optional(),
});

// Order schema
export const orderSchema = z.object({
    id: idSchema,
    table_id: idSchema.optional().nullable(),
    table_number: z.number().int().nonnegative().optional().nullable(),
    customer_name: z.string().optional().nullable(),
    customer_phone: z.string().optional().nullable(),
    order_time: timestampSchema,
    status: z.enum(['placed', 'preparing', 'ready', 'served', 'paid', 'cancelled', 'partially-cancelled']),
    server: z.string().optional().nullable(),
    staff_id: idSchema.optional().nullable(),
    order_type: z.enum(['dine-in', 'takeaway', 'quick-bill']).optional().nullable(),
    items: z.array(orderItemSchema),
    sub_total: priceSchema.optional(),
    sgst_rate: z.number().nonnegative().optional(),
    cgst_rate: z.number().nonnegative().optional(),
    sgst_amount: priceSchema.optional(),
    cgst_amount: priceSchema.optional(),
    total_amount: priceSchema.optional(),
    payment_method: z.enum(['cash', 'card', 'upi', 'other']).optional().nullable(),
    payment_status: z.enum(['pending', 'completed', 'failed']).optional().nullable(),
    payment_time: timestampSchema.optional().nullable(),
    allowed_next_states: z.array(z.string()).optional(),
});

// Table schema
export const tableSchema = z.object({
    id: idSchema,
    table_number: z.number().int().positive(),
    capacity: z.number().int().positive(),
    status: z.enum(['available', 'occupied', 'reserved', 'cleaning']),
    location: z.string().optional().nullable(),
    qr_code: z.string().optional().nullable(),
});

// Menu item schema
export const menuItemSchema = z.object({
    id: idSchema,
    name: z.string(),
    description: z.string().optional().nullable(),
    price: priceSchema,
    category_id: idSchema,
    image_url: z.string().optional().nullable(),
    is_available: z.boolean().default(true),
    is_vegetarian: z.boolean().optional(),
    include_in_gst: z.boolean().optional().default(true),
    preparation_time: z.number().int().nonnegative().optional(),
});

// Category schema
export const categorySchema = z.object({
    id: idSchema,
    name: z.string(),
    description: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    display_order: z.number().int().nonnegative().optional(),
});

// User schema
export const userSchema = z.object({
    id: idSchema,
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'manager', 'server', 'kitchen']),
    is_active: z.boolean().default(true),
    created_at: timestampSchema,
    updated_at: timestampSchema.optional(),
});

// Payment schema
export const paymentSchema = z.object({
    id: idSchema,
    order_id: idSchema,
    amount: priceSchema,
    payment_method: z.enum(['cash', 'card', 'upi', 'other']),
    status: z.enum(['pending', 'completed', 'failed']),
    transaction_id: z.string().optional().nullable(),
    payment_time: timestampSchema,
    staff_id: idSchema.optional().nullable(),
});

// Array schemas for list responses
export const ordersSchema = z.array(orderSchema);
export const tablesSchema = z.array(tableSchema);
export const menuItemsSchema = z.array(menuItemSchema);
export const categoriesSchema = z.array(categorySchema);
export const usersSchema = z.array(userSchema);
export const paymentsSchema = z.array(paymentSchema);

/**
 * Validate API response against a schema
 *
 * @param data The data to validate
 * @param schema The schema to validate against
 * @returns The validated data with proper types
 * @throws Error if validation fails
 */
export function validateApiResponse<T>(data: any, schema: z.ZodType<T>): T {
    try {
        return data;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('API response validation failed:', error.errors);
            throw new Error(`Invalid API response: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        throw error;
    }
}
