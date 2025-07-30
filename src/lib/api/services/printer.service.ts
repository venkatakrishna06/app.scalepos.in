import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import logger from '@/lib/services/logger.service';

export interface PrinterConfig {
    bill_printers: string[];
    kot_printers: string[];
    bar_printers: string[];
}

export const printerService = {
    getPrinterConfig: async (): Promise<PrinterConfig> => {
        try {
            const response = await api.get<PrinterConfig>(API_ENDPOINTS.PRINTER_CONFIG.GET);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updatePrinterConfig: async (config: PrinterConfig): Promise<PrinterConfig> => {
        try {
            const response = await api.post<PrinterConfig>(API_ENDPOINTS.PRINTER_CONFIG.UPDATE, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAvailablePrinters: async (): Promise<string[]> => {
        try {
            if (typeof window.qz === 'undefined') {
                await new Promise<void>((resolve) => {
                    if (typeof window.qz !== 'undefined') {
                        resolve();
                        return;
                    }
                    const checkQz = setInterval(() => {
                        if (typeof window.qz !== 'undefined') {
                            clearInterval(checkQz);
                            resolve();
                        }
                    }, 200);
                    setTimeout(() => {
                        clearInterval(checkQz);
                        resolve();
                    }, 5000);
                });
            }

            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available');
            }

            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            const printers = await window.qz.printers.find();
            return printers;
        } catch (error) {
            throw error;
        }
    },

    sendTestPrint: async (printers: string[], printerType: 'bill' | 'kot' | 'bar'): Promise<void> => {
        try {
            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available');
            }

            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            let testContent = '';
            switch (printerType) {
                case 'bill':
                    testContent = 'TEST PRINT - BILL PRINTER' +
                        'Restaurant: Test Restaurant' +
                        'Date: ' + new Date().toLocaleString() + '' +
                        'This is a test print for the bill printer.';
                    break;
                case 'kot':
                    testContent = 'TEST PRINT - KOT PRINTER' +
                        'Restaurant: Test Restaurant' +
                        'Date: ' + new Date().toLocaleString() + '' +
                        'This is a test print for the KOT printer.';
                    break;
                case 'bar':
                    testContent = 'TEST PRINT - BAR PRINTER' +
                        'Restaurant: Test Restaurant' +
                        'Date: ' + new Date().toLocaleString() + '' +
                        'This is a test print for the bar printer.';
                    break;
            }

            const failedPrinters: { name: string; error: string }[] = [];
            for (const printer of printers) {
                try {
                    const config = window.qz.configs.create(printer);
                    const data = [testContent];
                    await window.qz.print(config, data);
                    } catch (error) {
                    failedPrinters.push({
                        name: printer,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            if (failedPrinters.length > 0) {
                if (failedPrinters.length === printers.length) {
                    throw new Error(`Failed to print to all printers: ${failedPrinters.map(p => p.name).join(', ')}`);
                } else {
                    throw new Error(`Printed successfully to some printers, but failed for: ${failedPrinters.map(p => p.name).join(', ')}`);
                }
            }
        } catch (error) {
            throw error;
        }
    }
};

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
