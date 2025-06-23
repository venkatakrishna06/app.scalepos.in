import {useEffect, useState} from 'react';
import {RestaurantGstRates} from './gst/restaurant-rates';
import {CategoryGstSettings} from './gst/category-settings';
import {MenuItemGstSettings} from './gst/menu-item-settings';
import {menuService, restaurantService} from '@/lib/api/services';
import {Category, MenuItem, Restaurant} from '@/types';
import {AlertCircle, Loader2, Percent, RefreshCw} from 'lucide-react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';

export default function GstSettings() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('categories');

  // Fetch restaurant, menu items, and categories
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [restaurantData, menuItemsData, categoriesData] = await Promise.all([
        restaurantService.getRestaurant(),
        menuService.getItems(),
        menuService.getCategories(),
      ]);

      setRestaurant(restaurantData);
      setMenuItems(menuItemsData);
      setCategories(categoriesData);
    } catch {
      setError('Failed to load GST settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [refreshedMenuItems, refreshedCategories] = await Promise.all([
        menuService.getItems(),
        menuService.getCategories(),
      ]);

      setMenuItems(refreshedMenuItems);
      setCategories(refreshedCategories);
    } catch {
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading GST settings...</span>
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
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">GST Settings</h2>
        </div>
        <p className="text-muted-foreground">
          Configure tax rates for your restaurant, categories, and menu items.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData} 
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Tabs for different GST settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="menuItems">Menu Items</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <CategoryGstSettings 
            categories={categories} 
            onUpdate={(updatedCategories) => setCategories(updatedCategories)} 
            onMenuItemsRefresh={async () => {
              try {
                const refreshedMenuItems = await menuService.getItems();
                setMenuItems(refreshedMenuItems);
              } catch {
                setError('Failed to refresh menu items. Please try again.');
              }
            }}
          />
        </TabsContent>

        <TabsContent value="menuItems" className="space-y-4">
          <MenuItemGstSettings 
            menuItems={menuItems} 
            onUpdate={(updatedMenuItems) => setMenuItems(updatedMenuItems)} 
          />
        </TabsContent>

        <TabsContent value="restaurant" className="space-y-4">
          {restaurant && (
            <RestaurantGstRates
              restaurant={restaurant}
              onUpdate={(updatedRestaurant) => setRestaurant(updatedRestaurant)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
