import {useEffect, useRef, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Loader2, Printer} from 'lucide-react';
import {toast} from '@/lib/toast';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {PrinterConfig} from '@/lib/api/services/printer.service';
import {useAvailablePrinters, usePrinterConfig, useSendTestPrint, useUpdatePrinterConfig} from '@/api/printers';

export default function PrinterSettings() {
    const {
        data: printerConfig,
        isLoading: isLoadingConfig,
        isError: isErrorConfig,
        error: configError
    } = usePrinterConfig();
    const {
        data: availablePrinters = [],
        isLoading: isLoadingPrinters,
        isError: isErrorPrinters,
        error: printersError
    } = useAvailablePrinters();
    const updatePrinterConfigMutation = useUpdatePrinterConfig();
    const sendTestPrintMutation = useSendTestPrint();

    const [selectedBillPrinters, setSelectedBillPrinters] = useState<string[]>([]);
    const [selectedKotPrinters, setSelectedKotPrinters] = useState<string[]>([]);
    const [selectedBarPrinters, setSelectedBarPrinters] = useState<string[]>([]);
    const [billDropdownOpen, setBillDropdownOpen] = useState(false);
    const [kotDropdownOpen, setKotDropdownOpen] = useState(false);
    const [barDropdownOpen, setBarDropdownOpen] = useState(false);
    const billDropdownRef = useRef<HTMLDivElement>(null);
    const kotDropdownRef = useRef<HTMLDivElement>(null);
    const barDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (printerConfig) {
            setSelectedBillPrinters(printerConfig.bill_printers);
            setSelectedKotPrinters(printerConfig.kot_printers);
            setSelectedBarPrinters(printerConfig.bar_printers);
        }
    }, [printerConfig]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (billDropdownRef.current && !billDropdownRef.current.contains(event.target as Node) && billDropdownOpen) {
                setBillDropdownOpen(false);
            }
            if (kotDropdownRef.current && !kotDropdownRef.current.contains(event.target as Node) && kotDropdownOpen) {
                setKotDropdownOpen(false);
            }
            if (barDropdownRef.current && !barDropdownRef.current.contains(event.target as Node) && barDropdownOpen) {
                setBarDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [billDropdownOpen, kotDropdownOpen, barDropdownOpen]);

    const handleSave = async () => {
        try {
            const newConfig: PrinterConfig = {
                bill_printers: selectedBillPrinters,
                kot_printers: selectedKotPrinters,
                bar_printers: selectedBarPrinters
            };
            await updatePrinterConfigMutation.mutateAsync(newConfig);
            toast.success('Printer configuration saved successfully');
        } catch (_err) {
            toast.error('Failed to save printer configuration');
        }
    };

    const handleTestPrint = async (printerType: 'bill' | 'kot' | 'bar') => {
        try {
            let currentSelection: string[] = [];
            switch (printerType) {
                case 'bill':
                    currentSelection = selectedBillPrinters;
                    break;
                case 'kot':
                    currentSelection = selectedKotPrinters;
                    break;
                case 'bar':
                    currentSelection = selectedBarPrinters;
                    break;
            }
            await sendTestPrintMutation.mutateAsync({printers: currentSelection, printerType});
            toast.success(`Test print sent to ${printerType} printers`);
        } catch (_err) {
            toast.error(`Failed to send test print to ${printerType} printers`);
        }
    };

    const togglePrinter = (printer: string, type: 'bill' | 'kot' | 'bar') => {
        switch (type) {
            case 'bill':
                setSelectedBillPrinters(prev =>
                    prev.includes(printer)
                        ? prev.filter(p => p !== printer)
                        : [...prev, printer]
                );
                break;
            case 'kot':
                setSelectedKotPrinters(prev =>
                    prev.includes(printer)
                        ? prev.filter(p => p !== printer)
                        : [...prev, printer]
                );
                break;
            case 'bar':
                setSelectedBarPrinters(prev =>
                    prev.includes(printer)
                        ? prev.filter(p => p !== printer)
                        : [...prev, printer]
                );
                break;
        }
    };

    if (isLoadingConfig || isLoadingPrinters) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <span className="text-lg text-muted-foreground">Loading printer settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                        <Printer className="h-5 w-5 text-primary"/>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Printer Settings</h2>
                </div>
                <p className="text-muted-foreground">
                    Configure printers for different types of documents (bill, KOT, bar).
                </p>
            </div>

            {(isErrorConfig || isErrorPrinters) && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{configError?.message || printersError?.message}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Printer Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="bill-printers" className="text-base">Bill Printers</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTestPrint('bill')}
                                    disabled={sendTestPrintMutation.isLoading || selectedBillPrinters?.length === 0}
                                >
                                    {sendTestPrintMutation.isLoading ?
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Test Print
                                </Button>
                            </div>
                            <div className="relative" ref={billDropdownRef}>
                                <div
                                    className="flex flex-wrap gap-1 p-2 border rounded-md cursor-pointer min-h-10"
                                    onClick={() => setBillDropdownOpen(!billDropdownOpen)}
                                >
                                    {selectedBillPrinters?.length > 0 ? (
                                        selectedBillPrinters.map(printer => (
                                            <div key={printer} className="bg-primary/10 px-2 py-1 rounded-md text-sm">
                                                {printer}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">Select bill printers...</div>
                                    )}
                                </div>
                                {billDropdownOpen && (
                                    <div
                                        className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {availablePrinters?.length > 0 ? (
                                            availablePrinters.map(printer => (
                                                <div
                                                    key={printer}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-muted flex items-center space-x-2 ${selectedBillPrinters.includes(printer) ? 'bg-primary/10' : ''
                                                    }`}
                                                    onClick={() => togglePrinter(printer, 'bill')}
                                                >
                                                    <Checkbox
                                                        id={`bill-printer-${printer}`}
                                                        checked={selectedBillPrinters.includes(printer)}
                                                        onCheckedChange={() => togglePrinter(printer, 'bill')}
                                                        className="mr-2"
                                                    />
                                                    <label
                                                        htmlFor={`bill-printer-${printer}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        {printer}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-muted-foreground">
                                                No printers available
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="kot-printers" className="text-base">KOT Printers</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTestPrint('kot')}
                                    disabled={sendTestPrintMutation.isLoading || selectedKotPrinters?.length === 0}
                                >
                                    {sendTestPrintMutation.isLoading ?
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Test Print
                                </Button>
                            </div>
                            <div className="relative" ref={kotDropdownRef}>
                                <div
                                    className="flex flex-wrap gap-1 p-2 border rounded-md cursor-pointer min-h-10"
                                    onClick={() => setKotDropdownOpen(!kotDropdownOpen)}
                                >
                                    {selectedKotPrinters?.length > 0 ? (
                                        selectedKotPrinters.map(printer => (
                                            <div key={printer} className="bg-primary/10 px-2 py-1 rounded-md text-sm">
                                                {printer}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">Select KOT printers...</div>
                                    )}
                                </div>
                                {kotDropdownOpen && (
                                    <div
                                        className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {availablePrinters?.length > 0 ? (
                                            availablePrinters.map(printer => (
                                                <div
                                                    key={printer}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-muted flex items-center space-x-2 ${selectedKotPrinters.includes(printer) ? 'bg-primary/10' : ''
                                                    }`}
                                                    onClick={() => togglePrinter(printer, 'kot')}
                                                >
                                                    <Checkbox
                                                        id={`kot-printer-${printer}`}
                                                        checked={selectedKotPrinters.includes(printer)}
                                                        onCheckedChange={() => togglePrinter(printer, 'kot')}
                                                        className="mr-2"
                                                    />
                                                    <label
                                                        htmlFor={`kot-printer-${printer}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        {printer}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-muted-foreground">
                                                No printers available
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="bar-printers" className="text-base">Bar Printers</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTestPrint('bar')}
                                    disabled={sendTestPrintMutation.isLoading || selectedBarPrinters?.length === 0}
                                >
                                    {sendTestPrintMutation.isLoading ?
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Test Print
                                </Button>
                            </div>
                            <div className="relative" ref={barDropdownRef}>
                                <div
                                    className="flex flex-wrap gap-1 p-2 border rounded-md cursor-pointer min-h-10"
                                    onClick={() => setBarDropdownOpen(!barDropdownOpen)}
                                >
                                    {selectedBarPrinters?.length > 0 ? (
                                        selectedBarPrinters.map(printer => (
                                            <div key={printer} className="bg-primary/10 px-2 py-1 rounded-md text-sm">
                                                {printer}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">Select bar printers...</div>
                                    )}
                                </div>
                                {barDropdownOpen && (
                                    <div
                                        className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {availablePrinters?.length > 0 ? (
                                            availablePrinters.map(printer => (
                                                <div
                                                    key={printer}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-muted flex items-center space-x-2 ${selectedBarPrinters.includes(printer) ? 'bg-primary/10' : ''
                                                    }`}
                                                    onClick={() => togglePrinter(printer, 'bar')}
                                                >
                                                    <Checkbox
                                                        id={`bar-printer-${printer}`}
                                                        checked={selectedBarPrinters.includes(printer)}
                                                        onCheckedChange={() => togglePrinter(printer, 'bar')}
                                                        className="mr-2"
                                                    />
                                                    <label
                                                        htmlFor={`bar-printer-${printer}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        {printer}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-muted-foreground">
                                                No printers available
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={handleSave}
                                loading={updatePrinterConfigMutation.isPending}
                                loadingText="Saving Settings..."
                            >
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
