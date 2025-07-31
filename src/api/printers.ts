// src/api/printers.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {PrinterConfig, printerService} from '@/lib/api/services/printer.service';

const STALE_TIME = 1000 * 60 * 60; // 1 hour
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const usePrinterConfig = () => {
    return useQuery({
        queryKey: ['printerConfig'],
        queryFn: printerService.getPrinterConfig,
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useUpdatePrinterConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (config: PrinterConfig) => printerService.updatePrinterConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['printerConfig']});
        },
    });
};

export const useAvailablePrinters = () => {
    return useQuery({
        queryKey: ['availablePrinters'],
        queryFn: printerService.getAvailablePrinters,
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useSendTestPrint = () => {
    return useMutation({
        mutationFn: ({printers, printerType}: { printers: string[], printerType: 'bill' | 'kot' | 'bar' }) =>
            printerService.sendTestPrint(printers, printerType),
    });
};
