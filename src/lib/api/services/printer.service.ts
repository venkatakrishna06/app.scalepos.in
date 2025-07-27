import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';

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
        // Check if qz object is available
        if (typeof window.qz === 'undefined') {
            throw new Error('QZ Tray not available');
        }

        // Connect to QZ Tray if not already connected
        if (!window.qz.websocket.isActive()) {
            try {
                await window.qz.websocket.connect();
            } catch (error) {
                console.error('Error connecting to QZ Tray:', error);
                throw new Error('Failed to connect to QZ Tray');
            }
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

        // Track failed printers
        const failedPrinters: { name: string; error: string }[] = [];
        
        // Send test print to each printer, continuing even if some fail
        for (const printer of printers) {
            try {
                const config = window.qz.configs.create(printer);
                const data = [testContent];
                await window.qz.print(config, data);
            } catch (error) {
                console.error(`Error printing to ${printer}:`, error);
                failedPrinters.push({ 
                    name: printer, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
                // Continue with next printer instead of stopping
            }
        }
        
        // If any printers failed, throw an error with details
        if (failedPrinters.length > 0) {
            if (failedPrinters.length === printers.length) {
                // All printers failed
                throw new Error(`Failed to print to all printers: ${failedPrinters.map(p => p.name).join(', ')}`);
            } else {
                // Some printers failed, but others succeeded
                throw new Error(`Printed successfully to some printers, but failed for: ${failedPrinters.map(p => p.name).join(', ')}`);
            }
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
                setCertificatePromise: (certCallback: () => Promise<string>) => void;
                setSignaturePromise: (signCallback: (toSign: string) => Promise<string>) => void;
            };
        };
    }
}