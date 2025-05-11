import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { menuService, restaurantService } from '@/lib/api/services';
import { Restaurant, MenuItem, Category } from '@/types';

export default function GstSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sgstRate, setSgstRate] = useState<string>('');
  const [cgstRate, setCgstRate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurant, menu items, and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restaurantData, menuItemsData, categoriesData] = await Promise.all([
          restaurantService.getRestaurant(),
          menuService.getItems(),
          menuService.getCategories(),
        ]);

        setRestaurant(restaurantData);
        setMenuItems(menuItemsData);
        setCategories(categoriesData);

        // Set default GST rates
        if (restaurantData) {
          setSgstRate(restaurantData.default_sgst_rate?.toString() || '');
          setCgstRate(restaurantData.default_cgst_rate?.toString() || '');
        }
      } catch (err) {
        setError('Failed to load GST settings. Please try again.');
        console.error('Error fetching GST settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle category checkbox change
  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId ? { ...category, include_in_gst: checked } : category
      )
    );
  };

  // Handle menu item checkbox change
  const handleMenuItemChange = (itemId: number, checked: boolean) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === itemId ? { ...item, include_in_gst: checked } : item
      )
    );
  };

  // Save GST settings
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!restaurant) {
        throw new Error('Restaurant data not found');
      }

      // Validate GST rates
      const sgst = parseFloat(sgstRate);
      const cgst = parseFloat(cgstRate);

      if (isNaN(sgst) || isNaN(cgst)) {
        throw new Error('Please enter valid GST rates');
      }

      // Update restaurant GST rates
      await restaurantService.updateGstSettings(restaurant.id, sgst, cgst);

      // Update categories
      const categoryPromises = categories.map((category) =>
        menuService.updateCategory(category.id, { include_in_gst: category.include_in_gst })
      );

      // Update menu items
      const menuItemPromises = menuItems.map((item) =>
        menuService.updateItem(item.id, { include_in_gst: item.include_in_gst })
      );

      await Promise.all([...categoryPromises, ...menuItemPromises]);

      toast({
        title: 'Success',
        description: 'GST settings updated successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save GST settings';
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading GST settings...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Default GST Rates</h2>
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
      </div>

      <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Menu Categories</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Select which menu categories should be included in GST calculations
        </p>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={category.include_in_gst}
                onCheckedChange={(checked) => handleCategoryChange(category.id, !!checked)}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Menu Items</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Select which menu items should be included in GST calculations
        </p>
        <div className="space-y-4">
          {menuItems.map((item) => (
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
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save GST Settings
        </Button>
      </div>
    </div>
  );
}
