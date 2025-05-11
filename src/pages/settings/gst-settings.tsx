import { useState, useEffect } from 'react';
import { RestaurantGstRates } from './gst/restaurant-rates';
import { CategoryGstSettings } from './gst/category-settings';
import { MenuItemGstSettings } from './gst/menu-item-settings';
import { menuService, restaurantService } from '@/lib/api/services';
import { Restaurant, MenuItem, Category } from '@/types';
import { Loader2 } from 'lucide-react';

export default function GstSettings() {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
      } catch (err) {
        setError('Failed to load GST settings. Please try again.');
        console.error('Error fetching GST settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading GST settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}



      <CategoryGstSettings 
        categories={categories} 
        onUpdate={(updatedCategories) => setCategories(updatedCategories)} 
      />

      <MenuItemGstSettings 
        menuItems={menuItems} 
        onUpdate={(updatedMenuItems) => setMenuItems(updatedMenuItems)} 
      />
      {restaurant && (
          <RestaurantGstRates
              restaurant={restaurant}
              onUpdate={(updatedRestaurant) => setRestaurant(updatedRestaurant)}
          />
      )}
    </div>
  );
}
