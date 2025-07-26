import {create} from 'zustand';
import {printerService, PrinterConfig} from '@/lib/api/services/printer.service';
import {toast} from '@/lib/toast';

interface PrinterState {
    // Printer configuration
    printerConfig: PrinterConfig | null;
    // Available printers from QZ Tray
    availablePrinters: string[];
    // Loading states
    loading: boolean;
    savingConfig: boolean;
    testingPrint: boolean;
    // Error state
    error: string | null;
    // Methods
    fetchPrinterConfig: () => Promise<void>;
    fetchAvailablePrinters: () => Promise<void>;
    updatePrinterConfig: (config: PrinterConfig) => Promise<void>;
    sendTestPrint: (printerType: 'bill' | 'kot' | 'bar', customPrinters?: string[]) => Promise<void>;
}

/**
 * Store for managing printer configuration
 *
 * This store handles:
 * - Fetching and updating printer configuration
 * - Fetching available printers from QZ Tray
 * - Sending test prints to selected printers
 */
export const usePrinterStore = create<PrinterState>((set, get) => ({
    printerConfig: null,
    availablePrinters: [],
    loading: false,
    savingConfig: false,
    testingPrint: false,
    error: null,

    /**
     * Fetch the current printer configuration from the API
     */
    fetchPrinterConfig: async () => {
        try {
            set({loading: true, error: null});
            const printerConfig = await printerService.getPrinterConfig();
            set({printerConfig});
        } catch (err) {
            const errorMessage = 'Failed to fetch printer configuration';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },

    /**
     * Fetch available printers from QZ Tray
     */
    fetchAvailablePrinters: async () => {
        try {
            set({loading: true, error: null});
            const availablePrinters = await printerService.getAvailablePrinters();
            set({availablePrinters});
        } catch (err) {
            const errorMessage = 'Failed to fetch available printers';
            set({error: errorMessage});
            toast.error(errorMessage, {
                description: 'Make sure QZ Tray is installed and running'
            });
        } finally {
            set({loading: false});
        }
    },

    /**
     * Update the printer configuration
     * @param config The new printer configuration
     */
    updatePrinterConfig: async (config: PrinterConfig) => {
        try {
            set({savingConfig: true, error: null});
            const updatedConfig = await printerService.updatePrinterConfig(config);
            set({printerConfig: updatedConfig});
            toast.success('Printer configuration updated successfully');
        } catch (err) {
            const errorMessage = 'Failed to update printer configuration';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({savingConfig: false});
        }
    },

    /**
     * Send a test print to the selected printers of the specified type
     * @param printerType The type of printer to test (bill, kot, or bar)
     * @param customPrinters Optional custom list of printers to use instead of the saved configuration
     */
    sendTestPrint: async (printerType: 'bill' | 'kot' | 'bar', customPrinters?: string[]) => {
        try {
            set({testingPrint: true, error: null});
            
            let printers: string[] = [];
            
            // Use custom printers if provided, otherwise use the saved configuration
            if (customPrinters) {
                printers = customPrinters;
            } else {
                const {printerConfig} = get();
                
                if (!printerConfig) {
                    throw new Error('No printer configuration found');
                }

                switch (printerType) {
                    case 'bill':
                        printers = printerConfig.bill_printers;
                        break;
                    case 'kot':
                        printers = printerConfig.kot_printers;
                        break;
                    case 'bar':
                        printers = printerConfig.bar_printers;
                        break;
                }
            }

            if (printers.length === 0) {
                throw new Error(`No ${printerType} printers selected`);
            }

            await printerService.sendTestPrint(printers, printerType);
            toast.success(`Test print sent to ${printerType} printers`);
        } catch (err) {
            const error = err as Error;
            const errorMessage = `Failed to send test print: ${error.message}`;
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({testingPrint: false});
        }
    },
}));