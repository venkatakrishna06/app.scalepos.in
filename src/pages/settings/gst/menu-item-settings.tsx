import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { menuService } from '@/lib/api/services';
import { MenuItem } from '@/types';

interface MenuItemGstSettingsProps {
  menuItems: MenuItem[];
  onUpdate: (menuItems: MenuItem[]) => void;
}

export function MenuItemGstSettings({ menuItems, onUpdate }: MenuItemGstSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>(menuItems);
  const [originalMenuItems, setOriginalMenuItems] = useState<MenuItem[]>(menuItems);
  const [error, setError] = useState<string | null>(null);

  // Update original menu items when props change
  useEffect(() => {
    setLocalMenuItems(menuItems);
    setOriginalMenuItems(menuItems);
  }, [menuItems]);

  // Handle menu item checkbox change
  const handleMenuItemChange = (itemId: number, checked: boolean) => {
    setLocalMenuItems(
      localMenuItems.map((item) =>
        item.id === itemId ? { ...item, include_in_gst: checked } : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Find menu items that have changed
      const changedMenuItems = localMenuItems.filter(
        (item) => {
          const original = originalMenuItems.find(i => i.id === item.id);
          return original && original.include_in_gst !== item.include_in_gst;
        }
      );

      // Only update menu items that have changed
      const menuItemPromises = changedMenuItems.map((item) =>
        menuService.updateItem(item.id, { include_in_gst: item.include_in_gst })
      );

      await Promise.all(menuItemPromises);
      onUpdate(localMenuItems);

      // Update original menu items after successful save
      setOriginalMenuItems(localMenuItems);

      toast({
        title: 'Success',
        description: `Menu item GST settings updated successfully (${changedMenuItems.length} items changed)`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save menu item GST settings';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Items</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          Select which menu items should be included in GST calculations
        </p>

        <div className="space-y-4">
          {localMenuItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={`item-${item.id}`}
                checked={item.include_in_gst}
                onCheckedChange={(checked) => handleMenuItemChange(item.id, !!checked)}
              />
              <label
                htmlFor={`item-${item.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {item.name} - {item.category.name} - ₹{item.price.toFixed(2)}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Menu Item Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
