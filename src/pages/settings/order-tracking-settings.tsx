import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {ClipboardList, Loader2} from 'lucide-react';
import {useRestaurantStore} from '@/lib/store';
import {toast} from '@/lib/toast';
import {Switch} from '@/components/ui/switch';
import {Alert, AlertDescription} from '@/components/ui/alert';

export default function OrderTrackingSettings() {
  const { restaurant, loading, error: storeError, fetchRestaurant, toggleOrderTracking } = useRestaurantStore();
  const [saving, setSaving] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch restaurant data if not already loaded
    if (!restaurant) {
      fetchRestaurant();
    } else {
      // Initialize tracking state from restaurant data
      setTrackingEnabled(restaurant.enable_order_status_tracking || false);
    }
  }, [restaurant, fetchRestaurant]);

  // Update tracking state when restaurant data changes
  useEffect(() => {
    if (restaurant) {
      setTrackingEnabled(restaurant.enable_order_status_tracking || false);
    }
  }, [restaurant]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update order tracking setting
      await toggleOrderTracking(trackingEnabled);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save order tracking settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !restaurant) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with description */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-full">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Order Tracking Settings</h2>
        </div>
        <p className="text-muted-foreground">
          Configure order status tracking for your restaurant.
        </p>
      </div>

      {/* Error alert */}
      {(error || storeError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error || storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Status Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Enable Order Status Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  When disabled, orders will only have basic statuses (placed, paid, cancelled).
                  Order items will only have cancelled status when cancelled.
                </p>
              </div>
              <Switch
                checked={trackingEnabled}
                onCheckedChange={setTrackingEnabled}
                aria-label="Toggle order tracking"
              />
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Available Order Statuses:</h4>
              <div className="text-sm">
                {trackingEnabled ? (
                  <ul className="list-disc list-inside space-y-1">
                    <li>placed</li>
                    <li>preparing</li>
                    <li>served</li>
                    <li>cancelled</li>
                    <li>paid</li>
                    <li>partially-cancelled</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    <li>placed</li>
                    <li>paid</li>
                    <li>cancelled</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-sm font-medium mb-2">Available Order Item Statuses:</h4>
              <div className="text-sm">
                {trackingEnabled ? (
                  <ul className="list-disc list-inside space-y-1">
                    <li>placed</li>
                    <li>preparing</li>
                    <li>served</li>
                    <li>cancelled</li>
                    <li>ready</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    <li>placed</li>
                    <li>cancelled</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
