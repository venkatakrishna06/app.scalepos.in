import { MenuItem, OrderItem, Restaurant } from '@/types';

interface GstResult {
  sgstAmount: number;
  cgstAmount: number;
  totalGstAmount: number;
  totalWithGst: number;
  subTotal: number;
  sgstRate: number;
  cgstRate: number;
}

/**
 * Calculate GST for a list of order items
 * 
 * @param orderItems - List of order items
 * @param menuItems - List of menu items to get price and GST inclusion info
 * @param restaurant - Restaurant details with GST rates
 * @param totalAmount - Optional pre-calculated total amount
 * @returns Object with GST calculation results
 */
export const calculateGst = (
  orderItems: OrderItem[],
  menuItems: MenuItem[],
  restaurant: Restaurant,
  totalAmount?: number
): GstResult => {
  // Default GST rates from restaurant
  const sgstRate = restaurant.default_sgst_rate || 2.5;
  const cgstRate = restaurant.default_cgst_rate || 2.5;
  
  // Calculate subtotal for items that are included in GST
  let gstableAmount = 0;
  let subTotal = 0;
  
  orderItems.forEach(item => {
    const menuItem = menuItems.find(m => m.id === item.menu_item_id);
    if (!menuItem) return;
    
    const itemTotal = menuItem.price * item.quantity;
    subTotal += itemTotal;
    
    // Check if item is included in GST calculation
    if (menuItem.include_in_gst !== false) {
      gstableAmount += itemTotal;
    }
  });
  
  // If totalAmount is provided, use it instead of calculated subTotal
  if (totalAmount !== undefined) {
    subTotal = totalAmount;
  }
  
  // Calculate GST amounts
  const sgstAmount = (gstableAmount * sgstRate) / 100;
  const cgstAmount = (gstableAmount * cgstRate) / 100;
  const totalGstAmount = sgstAmount + cgstAmount;
  
  // Calculate total with GST
  const totalWithGst = subTotal + totalGstAmount;
  
  return {
    sgstAmount,
    cgstAmount,
    totalGstAmount,
    totalWithGst,
    subTotal,
    sgstRate,
    cgstRate
  };
};