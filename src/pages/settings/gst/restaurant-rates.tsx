import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Loader2} from 'lucide-react';
import {Restaurant} from '@/types';
import {toast} from '@/lib/toast';
import {useUpdateGstSettings} from '@/api/restaurant';

interface RestaurantGstRatesProps {
    restaurant: Restaurant;
    onUpdate: (restaurant: Restaurant) => void;
}

export function RestaurantGstRates({restaurant, onUpdate}: RestaurantGstRatesProps) {
    const updateGstSettingsMutation = useUpdateGstSettings();
    const [sgstRate, setSgstRate] = useState<string>(restaurant.default_sgst_rate?.toString() || '');
    const [cgstRate, setCgstRate] = useState<string>(restaurant.default_cgst_rate?.toString() || '');
    const [originalSgstRate, setOriginalSgstRate] = useState<string>(restaurant.default_sgst_rate?.toString() || '');
    const [originalCgstRate, setOriginalCgstRate] = useState<string>(restaurant.default_cgst_rate?.toString() || '');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSgstRate(restaurant.default_sgst_rate?.toString() || '');
        setCgstRate(restaurant.default_cgst_rate?.toString() || '');
        setOriginalSgstRate(restaurant.default_sgst_rate?.toString() || '');
        setOriginalCgstRate(restaurant.default_cgst_rate?.toString() || '');
    }, [restaurant]);

    const handleSave = async () => {
        try {
            setError(null);
            const sgst = parseFloat(sgstRate);
            const cgst = parseFloat(cgstRate);

            if (isNaN(sgst) || isNaN(cgst)) {
                throw new Error('Please enter valid GST rates');
            }

            const originalSgst = parseFloat(originalSgstRate);
            const originalCgst = parseFloat(originalCgstRate);

            if (sgst === originalSgst && cgst === originalCgst) {
                toast.info('No changes detected in GST rates');
                return;
            }

            const updatedRestaurant = await updateGstSettingsMutation.mutateAsync({
                id: restaurant.id,
                sgstRate: sgst,
                cgstRate: cgst
            });
            onUpdate(updatedRestaurant);
            setOriginalSgstRate(sgstRate);
            setOriginalCgstRate(cgstRate);
            toast.success('GST rates updated successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save GST rates';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Default GST Rates</CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium">SGST Rate (%)</label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={sgstRate}
                            onChange={(e) => setSgstRate(e.target.value)}
                            placeholder="Enter SGST rate"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">CGST Rate (%)</label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cgstRate}
                            onChange={(e) => setCgstRate(e.target.value)}
                            placeholder="Enter CGST rate"
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={handleSave}
                        loading={updateGstSettingsMutation.isPending}
                        loadingText="Saving GST Rates..."
                    >
                        Save GST Rates
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
