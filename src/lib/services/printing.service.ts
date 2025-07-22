import { toast } from '@/lib/toast';
import { Order, OrderItem } from '@/types';
import { usePrinterStore } from '@/lib/store/printer.store';
import { setupQZSecurity } from '@/lib/qz/qzSetup';

// ESC/POS command constants
const ESC = '\x1b';
const GS = '\x1d';

// ESC/POS Commands
export const ESCPOS = {
    // Initialize printer
    INIT: ESC + '@',
    // Text formatting
    BOLD_ON: ESC + 'E' + '\x01',
    BOLD_OFF: ESC + 'E' + '\x00',
    UNDERLINE_ON: ESC + '-' + '\x01',
    UNDERLINE_OFF: ESC + '-' + '\x00',
    // Text alignment
    ALIGN_LEFT: ESC + 'a' + '\x00',
    ALIGN_CENTER: ESC + 'a' + '\x01',
    ALIGN_RIGHT: ESC + 'a' + '\x02',
    // Font sizes
    FONT_SIZE_NORMAL: GS + '!' + '\x00',
    FONT_SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01',
    FONT_SIZE_DOUBLE_WIDTH: GS + '!' + '\x10',
    FONT_SIZE_DOUBLE: GS + '!' + '\x11',
    // Line feeds
    LF: '\n',
    CR: '\r',
    CRLF: '\r\n',
    // Paper cutting
    CUT_PAPER: GS + 'V' + '\x41' + '\x03',
    // Drawer kick
    DRAWER_KICK: ESC + 'p' + '\x00' + '\x19' + '\xfa',
};

// Helper function to pad string to specific width
export const padString = (str: string, width: number, padChar: string = ' '): string => {
    if (str.length >= width) return str.substring(0, width);
    return str + padChar.repeat(width - str.length);
};

// Helper function to create a line separator
export const createSeparatorLine = (char: string = '-', width: number = 32): string => {
    return char.repeat(width);
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
};

// Helper function to split long text into multiple lines
export const wrapText = (text: string, maxWidth: number): string[] => {
    if (text.length <= maxWidth) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxWidth) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // Word is longer than max width, force break it
                lines.push(word.substring(0, maxWidth));
                currentLine = word.substring(maxWidth);
            }
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};

/**
 * Centralized printing service for all printing operations
 * Uses QZ Tray for direct printing to thermal printers
 */
export const printingService = {
    /**
     * Check if QZ Tray is available and connect if needed
     * @returns True if QZ Tray is available and connected
     */
    ensureQzTrayConnection: async (): Promise<boolean> => {
        try {
            // Check if qz object is available
            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available. Please ensure QZ Tray is installed and running.');
            }

            // Set up security configuration before connecting
            setupQZSecurity();

            // Connect to QZ Tray if not already connected
            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect to QZ Tray';
            toast.error('Printing Error', { description: errorMessage });
            console.error('QZ Tray connection error:', error);
            return false;
        }
    },

    /**
     * Print a bill using QZ Tray
     * @param order The order to print a bill for
     * @param restaurantInfo Restaurant information for the bill header
     * @returns True if printing was successful
     */
    printBill: async (order: Order, restaurantInfo: any): Promise<boolean> => {
        try {
            // Ensure QZ Tray is connected
            const isConnected = await printingService.ensureQzTrayConnection();
            if (!isConnected) return false;

            // Get printer configuration
            const printerConfig = usePrinterStore.getState().printerConfig;
            if (!printerConfig) {
                throw new Error('No printer configuration found');
            }

            // Get bill printers from configuration
            const billPrinters = printerConfig.bill_printers;
            if (billPrinters.length === 0) {
                throw new Error('No bill printers configured. Please configure printers in settings.');
            }

            // Generate ESC/POS receipt content
            const receiptContent = printingService.generateBillContent(order, restaurantInfo);

            // Print to all configured bill printers
            for (const printer of billPrinters) {
                const config = window.qz.configs.create(printer);
                const data = [receiptContent];
                await window.qz.print(config, data);
            }

            toast.success('Bill printed successfully');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to print bill';
            toast.error('Printing Error', { description: errorMessage });
            console.error('Bill printing error:', error);
            return false;
        }
    },

    /**
     * Print a Kitchen Order Ticket (KOT) using QZ Tray
     * @param items The order items to print
     * @param orderInfo Additional order information (table, server, type, etc.)
     * @param restaurantInfo Restaurant information for the KOT header
     * @returns True if printing was successful
     */
    printKOT: async (
        items: OrderItem[], 
        orderInfo: { 
            table_id?: number; 
            server?: string; 
            orderType: string; 
            tokenNumber?: string;
        },
        restaurantInfo: any
    ): Promise<boolean> => {
        try {
            // Ensure QZ Tray is connected
            const isConnected = await printingService.ensureQzTrayConnection();
            if (!isConnected) return false;

            // Get printer configuration
            const printerConfig = usePrinterStore.getState().printerConfig;
            if (!printerConfig) {
                throw new Error('No printer configuration found');
            }

            // Get KOT printers from configuration
            const kotPrinters = printerConfig.kot_printers;
            if (kotPrinters.length === 0) {
                throw new Error('No KOT printers configured. Please configure printers in settings.');
            }

            // Generate ESC/POS KOT content
            const kotContent = printingService.generateKOTContent(items, orderInfo, restaurantInfo);

            // Print to all configured KOT printers
            for (const printer of kotPrinters) {
                const config = window.qz.configs.create(printer);
                const data = [kotContent];
                await window.qz.print(config, data);
            }

            toast.success('KOT printed successfully');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to print KOT';
            toast.error('Printing Error', { description: errorMessage });
            console.error('KOT printing error:', error);
            return false;
        }
    },

    /**
     * Generate ESC/POS formatted content for a bill
     * @param order The order to generate a bill for
     * @param restaurantInfo Restaurant information for the bill header
     * @returns ESC/POS formatted bill content
     */
    generateBillContent: (order: Order, restaurantInfo: any): string => {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN');
        const timeFormatted = now.toLocaleTimeString('en-IN');
        const orderType = order?.order_type === 'takeaway' ? 'Takeaway' :
            order?.order_type === 'quick-bill' ? 'Quick Bill' : 'Dine-in';

        let receipt = '';

        // Initialize printer
        receipt += ESCPOS.INIT;

        // Header with restaurant name
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += ESCPOS.FONT_SIZE_DOUBLE;
        receipt += ESCPOS.BOLD_ON;
        receipt += (restaurantInfo?.name || 'Restaurant Name').toUpperCase();
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;

        // Restaurant details
        const restaurantAddress = restaurantInfo?.address || 'Restaurant Address';
        const addressLines = wrapText(restaurantAddress, 32);
        addressLines.forEach(line => {
            receipt += line;
            receipt += ESCPOS.LF;
        });

        receipt += `Phone: ${restaurantInfo?.phone || 'Phone Number'}`;
        receipt += ESCPOS.LF;
        receipt += `GST No: ${restaurantInfo?.gst_number || 'GST Number'}`;
        receipt += ESCPOS.LF;

        // Separator
        receipt += ESCPOS.ALIGN_LEFT;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // Bill information
        receipt += ESCPOS.BOLD_ON;
        receipt += padString(`Bill No: ${order?.id}`, 16) + padString(`Date: ${dateFormatted}`, 16);
        receipt += ESCPOS.LF;
        receipt += padString(`Time: ${timeFormatted}`, 16) + padString(`Type: ${orderType}`, 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;

        // Table info for dine-in orders
        if (order?.order_type === 'dine-in') {
            receipt += padString(`Table: ${order?.table_id || 'N/A'}`, 16);
            receipt += padString(`Server: ${order?.server || 'N/A'}`, 16);
            receipt += ESCPOS.LF;
        }

        // Token number if available
        if (order?.token_number) {
            receipt += ESCPOS.ALIGN_CENTER;
            receipt += ESCPOS.BOLD_ON;
            receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
            receipt += `TOKEN NO: ${order.token_number}`;
            receipt += ESCPOS.LF;
            receipt += ESCPOS.FONT_SIZE_NORMAL;
            receipt += ESCPOS.BOLD_OFF;
            receipt += ESCPOS.ALIGN_LEFT;
        }

        // Separator
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // Items header
        receipt += ESCPOS.BOLD_ON;
        receipt += padString('Item', 16) + padString('Qty', 4) + padString('Rate', 6) + padString('Amount', 6);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Order items
        const orderItems = order?.items || [];
        orderItems
            .filter(item => item.status !== 'cancelled')
            .forEach(item => {
                // Item name (wrap if too long)
                const itemNameLines = wrapText(item.name, 32);
                itemNameLines.forEach((line, index) => {
                    if (index === 0) {
                        // First line with quantity, rate, and amount
                        receipt += padString(line, 16) +
                            padString(item.quantity.toString(), 4) +
                            padString(formatCurrency(item.price), 6) +
                            padString(formatCurrency(item.quantity * item.price), 6);
                    } else {
                        // Continuation lines
                        receipt += line;
                    }
                    receipt += ESCPOS.LF;
                });
            });

        // Separator
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Totals section
        const gstDetails = {
            subTotal: order.sub_total || 0,
            sgstAmount: order.sgst_amount || 0,
            cgstAmount: order.cgst_amount || 0,
            sgstRate: order.sgst_rate || 0,
            cgstRate: order.cgst_rate || 0,
            totalAmount: order.total_amount || 0
        };

        receipt += padString('Subtotal:', 16) + padString(formatCurrency(gstDetails.subTotal), 16);
        receipt += ESCPOS.LF;

        if (gstDetails.sgstAmount > 0) {
            receipt += padString(`SGST (${gstDetails.sgstRate}%):`, 16) + padString(formatCurrency(gstDetails.sgstAmount), 16);
            receipt += ESCPOS.LF;
        }

        if (gstDetails.cgstAmount > 0) {
            receipt += padString(`CGST (${gstDetails.cgstRate}%):`, 16) + padString(formatCurrency(gstDetails.cgstAmount), 16);
            receipt += ESCPOS.LF;
        }

        // Total amount
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_ON;
        receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
        receipt += padString('TOTAL:', 16) + padString(formatCurrency(gstDetails.totalAmount), 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;
        receipt += ESCPOS.BOLD_OFF;

        // Payment method
        if (order.payment_method) {
            receipt += ESCPOS.LF;
            receipt += padString('Payment Method:', 16) + padString(order.payment_method.toUpperCase(), 16);
            receipt += ESCPOS.LF;
        }

        // Footer
        receipt += ESCPOS.LF;
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += 'Thank you for your visit!';
        receipt += ESCPOS.LF;
        receipt += 'Please visit again';
        receipt += ESCPOS.LF;
        receipt += ESCPOS.LF;

        // Cut paper
        receipt += ESCPOS.CUT_PAPER;

        return receipt;
    },

    /**
     * Generate ESC/POS formatted content for a Kitchen Order Ticket (KOT)
     * @param items The order items to print
     * @param orderInfo Additional order information (table, server, type, etc.)
     * @param restaurantInfo Restaurant information for the KOT header
     * @returns ESC/POS formatted KOT content
     */
    generateKOTContent: (
        items: OrderItem[], 
        orderInfo: { 
            table_id?: number; 
            server?: string; 
            orderType: string; 
            tokenNumber?: string;
        },
        restaurantInfo: any
    ): string => {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN');
        const timeFormatted = now.toLocaleTimeString('en-IN');
        const kotNumber = Date.now().toString().slice(-6);

        let kot = '';

        // Initialize printer
        kot += ESCPOS.INIT;

        // Header with KOT title
        kot += ESCPOS.ALIGN_CENTER;
        kot += ESCPOS.FONT_SIZE_DOUBLE;
        kot += ESCPOS.BOLD_ON;
        kot += 'KITCHEN ORDER TICKET';
        kot += ESCPOS.LF;
        kot += ESCPOS.BOLD_OFF;
        kot += ESCPOS.FONT_SIZE_NORMAL;

        // Restaurant name
        kot += (restaurantInfo?.name || 'Restaurant Name').toUpperCase();
        kot += ESCPOS.LF;
        
        // Date and time
        kot += `Date: ${dateFormatted} Time: ${timeFormatted}`;
        kot += ESCPOS.LF;

        // Separator
        kot += ESCPOS.ALIGN_LEFT;
        kot += createSeparatorLine('=', 32);
        kot += ESCPOS.LF;

        // KOT information
        kot += ESCPOS.BOLD_ON;
        kot += padString(`KOT No: ${kotNumber}`, 16) + padString(`Table: ${orderInfo.table_id || 'N/A'}`, 16);
        kot += ESCPOS.LF;
        kot += padString(`Server: ${orderInfo.server || 'N/A'}`, 16) + padString(`Type: ${orderInfo.orderType}`, 16);
        kot += ESCPOS.LF;
        kot += ESCPOS.BOLD_OFF;

        // Token number for takeaway and quick-bill orders
        if (orderInfo.tokenNumber) {
            kot += ESCPOS.ALIGN_CENTER;
            kot += ESCPOS.BOLD_ON;
            kot += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
            kot += `TOKEN NO: ${orderInfo.tokenNumber}`;
            kot += ESCPOS.LF;
            kot += ESCPOS.FONT_SIZE_NORMAL;
            kot += ESCPOS.BOLD_OFF;
            kot += ESCPOS.ALIGN_LEFT;
        }

        // Separator
        kot += createSeparatorLine('=', 32);
        kot += ESCPOS.LF;

        // Items header
        kot += ESCPOS.BOLD_ON;
        kot += padString('Item', 20) + padString('Qty', 6) + padString('Notes', 6);
        kot += ESCPOS.LF;
        kot += ESCPOS.BOLD_OFF;
        kot += createSeparatorLine('-', 32);
        kot += ESCPOS.LF;

        // Order items
        items.forEach(item => {
            // Item name (wrap if too long)
            const itemNameLines = wrapText(item.name, 20);
            itemNameLines.forEach((line, index) => {
                if (index === 0) {
                    // First line with quantity
                    kot += padString(line, 20) + padString(item.quantity.toString(), 6);
                    
                    // Add notes indicator if there are notes
                    if (item.notes) {
                        kot += padString('*', 6);
                    } else {
                        kot += padString('', 6);
                    }
                } else {
                    // Continuation lines
                    kot += line;
                }
                kot += ESCPOS.LF;
            });

            // Print notes if any
            if (item.notes) {
                kot += '  Note: ';
                const noteLines = wrapText(item.notes, 30);
                noteLines.forEach((line, index) => {
                    if (index === 0) {
                        kot += line;
                    } else {
                        kot += '  ' + line;
                    }
                    kot += ESCPOS.LF;
                });
            }
        });

        // Separator
        kot += createSeparatorLine('-', 32);
        kot += ESCPOS.LF;

        // Footer
        kot += ESCPOS.ALIGN_CENTER;
        kot += '*** Kitchen Copy ***';
        kot += ESCPOS.LF;
        kot += ESCPOS.LF;

        // Cut paper
        kot += ESCPOS.CUT_PAPER;

        return kot;
    }
};

// Add QZ Tray type definitions
declare global {
    interface Window {
        qz: {
            websocket: {
                connect: () => Promise<void>;
                isActive: () => boolean;
            };
            printers: {
                find: () => Promise<string[]>;
            };
            configs: {
                create: (printer: string) => any;
            };
            print: (config: any, data: any) => Promise<void>;
            security: {
                setCertificatePromise: (promiseFn: () => Promise<string>) => void;
                setSignaturePromise: (promiseFn: (toSign: string) => Promise<string>) => void;
                setSitePromise: (promiseFn: (site: string) => Promise<boolean>) => void;
            };
        };
    }
}