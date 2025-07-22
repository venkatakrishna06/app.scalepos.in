import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {setupQZSecurity} from '@/lib/qz/qzSetup';

export interface PrinterConfig {
    bill_printers: string[];
    kot_printers: string[];
    bar_printers: string[];
}

export const printerService = {
    /**
     * Get the current printer configuration
     * @returns The current printer configuration
     */
    getPrinterConfig: async (): Promise<PrinterConfig> => {
        const response = await api.get<PrinterConfig>(API_ENDPOINTS.PRINTER_CONFIG.GET);
        return response.data;
    },

    /**
     * Update the printer configuration
     * @param config The new printer configuration
     * @returns The updated printer configuration
     */
    updatePrinterConfig: async (config: PrinterConfig): Promise<PrinterConfig> => {
        const response = await api.post<PrinterConfig>(API_ENDPOINTS.PRINTER_CONFIG.UPDATE, config);
        return response.data;
    },

    /**
     * Get available printers from QZ Tray
     * @returns List of available printer names
     */
    getAvailablePrinters: async (): Promise<string[]> => {
        try {
            // Check if qz object is available
            if (typeof window.qz === 'undefined') {
                await new Promise<void>((resolve) => {
                    // Wait for QZ Tray to be loaded
                    if (typeof window.qz !== 'undefined') {
                        resolve();
                        return;
                    }

                    // Set up a listener for when QZ Tray is loaded
                    const checkQz = setInterval(() => {
                        if (typeof window.qz !== 'undefined') {
                            clearInterval(checkQz);
                            resolve();
                        }
                    }, 200);

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        clearInterval(checkQz);
                        resolve();
                    }, 5000);
                });
            }

            // If QZ Tray is still not available, throw an error
            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available');
            }

            // Set up security configuration before connecting
            setupQZSecurity();

            // Connect to QZ Tray if not already connected
            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            // Get available printers
            const printers = await window.qz.printers.find();
            return printers;
        } catch (error) {
            console.error('Error getting available printers:', error);
            throw error;
        }
    },

    /**
     * Send a test print to the specified printers
     * @param printers List of printer names to send the test print to
     * @param printerType Type of printer (bill, kot, or bar)
     * @returns Promise that resolves when the print is complete
     */
    sendTestPrint: async (printers: string[], printerType: 'bill' | 'kot' | 'bar'): Promise<void> => {
        try {
            // Check if qz object is available
            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available');
            }

            // Set up security configuration before connecting
            setupQZSecurity();

            // Connect to QZ Tray if not already connected
            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            // Create test print content based on printer type
            let testContent = '';
            switch (printerType) {
                case 'bill':
                    testContent = 'TEST PRINT - BILL PRINTER\n\n' +
                        'Restaurant: Test Restaurant\n' +
                        'Date: ' + new Date().toLocaleString() + '\n\n' +
                        'This is a test print for the bill printer.\n\n';
                    break;
                case 'kot':
                    testContent = 'TEST PRINT - KOT PRINTER\n\n' +
                        'Restaurant: Test Restaurant\n' +
                        'Date: ' + new Date().toLocaleString() + '\n\n' +
                        'This is a test print for the KOT printer.\n\n';
                    break;
                case 'bar':
                    testContent = 'TEST PRINT - BAR PRINTER\n\n' +
                        'Restaurant: Test Restaurant\n' +
                        'Date: ' + new Date().toLocaleString() + '\n\n' +
                        'This is a test print for the bar printer.\n\n';
                    break;
            }

            // Send test print to each printer
            for (const printer of printers) {
                const config = window.qz.configs.create(printer);
                const data = [testContent];
                await window.qz.print(config, data);
            }
        } catch (error) {
            console.error('Error sending test print:', error);
            throw error;
        }
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