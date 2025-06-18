import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Loader2} from 'lucide-react';
import {restaurantService} from '@/lib/api/services';
import {Restaurant} from '@/types';
import {toast} from '@/lib/toast';

interface RestaurantGstRatesProps {
  restaurant: Restaurant;
  onUpdate: (restaurant: Restaurant) => void;
}

export function RestaurantGstRates({ restaurant, onUpdate }: RestaurantGstRatesProps) {
  const [saving, setSaving] = useState(false);
  const [sgstRate, setSgstRate] = useState<string>(restaurant.default_sgst_rate?.toString() || '');
  const [cgstRate, setCgstRate] = useState<string>(restaurant.default_cgst_rate?.toString() || '');
  const [originalSgstRate, setOriginalSgstRate] = useState<string>(restaurant.default_sgst_rate?.toString() || '');
  const [originalCgstRate, setOriginalCgstRate] = useState<string>(restaurant.default_cgst_rate?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  // Update original rates when restaurant prop changes
  useEffect(() => {
    setSgstRate(restaurant.default_sgst_rate?.toString() || '');
    setCgstRate(restaurant.default_cgst_rate?.toString() || '');
    setOriginalSgstRate(restaurant.default_sgst_rate?.toString() || '');
    setOriginalCgstRate(restaurant.default_cgst_rate?.toString() || '');
  }, [restaurant]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate GST rates
      const sgst = parseFloat(sgstRate);
      const cgst = parseFloat(cgstRate);

      if (isNaN(sgst) || isNaN(cgst)) {
        throw new Error('Please enter valid GST rates');
      }

      // Check if rates have changed
      const originalSgst = parseFloat(originalSgstRate);
      const originalCgst = parseFloat(originalCgstRate);

      if (sgst === originalSgst && cgst === originalCgst) {
        toast.info('No changes detected in GST rates');
        setSaving(false);
        return;
      }

      // Update restaurant GST rates
      const updatedRestaurant = await restaurantService.updateGstSettings(restaurant.id, sgst, cgst);
      onUpdate(updatedRestaurant);

      // Update original rates after successful save
      setOriginalSgstRate(sgstRate);
      setOriginalCgstRate(cgstRate);

      toast.success('GST rates updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save GST rates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
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
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save GST Rates
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
