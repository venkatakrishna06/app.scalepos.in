import {useState} from 'react';
import {RestaurantGstRates} from './gst/restaurant-rates';
import {CategoryGstSettings} from './gst/category-settings';
import {MenuItemGstSettings} from './gst/menu-item-settings';
import {AlertCircle, Loader2, Percent, RefreshCw} from 'lucide-react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {useRestaurant} from '@/api/restaurant';
import {useCategories, useMenuItems} from '@/api/menu';

export default function GstSettings() {
    const {
        data: restaurant,
        isLoading: isLoadingRestaurant,
        isError: isErrorRestaurant,
        error: restaurantError,
        refetch: refetchRestaurant
    } = useRestaurant();
    const {
        data: menuItems = [],
        isLoading: isLoadingMenuItems,
        isError: isErrorMenuItems,
        error: menuItemsError,
        refetch: refetchMenuItems
    } = useMenuItems();
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        isError: isErrorCategories,
        error: categoriesError,
        refetch: refetchCategories
    } = useCategories();
    const [activeTab, setActiveTab] = useState('categories');

    const isLoading = isLoadingRestaurant || isLoadingMenuItems || isLoadingCategories;
    const isError = isErrorRestaurant || isErrorMenuItems || isErrorCategories;
    const error = restaurantError || menuItemsError || categoriesError;

    const refreshData = () => {
        refetchRestaurant();
        refetchMenuItems();
        refetchCategories();
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <span className="text-lg text-muted-foreground">Loading GST settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                        <Percent className="h-5 w-5 text-primary"/>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">GST Settings</h2>
                </div>
                <p className="text-muted-foreground">
                    Configure tax rates for your restaurant, categories, and menu items.
                </p>
            </div>

            {isError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription>{error?.message || 'Failed to load GST settings. Please try again.'}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
                    Refresh Data
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-3">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="menuItems">Menu Items</TabsTrigger>
                    <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4">
                    <CategoryGstSettings
                        categories={categories}
                        onUpdate={() => refetchCategories()}
                        onMenuItemsRefresh={() => refetchMenuItems()}
                    />
                </TabsContent>

                <TabsContent value="menuItems" className="space-y-4">
                    <MenuItemGstSettings
                        menuItems={menuItems}
                        onUpdate={() => refetchMenuItems()}
                    />
                </TabsContent>

                <TabsContent value="restaurant" className="space-y-4">
                    {restaurant && (
                        <RestaurantGstRates
                            restaurant={restaurant}
                            onUpdate={() => refetchRestaurant()}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
