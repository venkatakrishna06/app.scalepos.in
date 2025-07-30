import {Loader2, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useDashboard} from '@/hooks/useDashboard';
import {Stats} from './dashboard/Stats';
import {RecentOrders} from './dashboard/RecentOrders';
import {PopularItems} from './dashboard/PopularItems';
import {QuickActions} from './dashboard/QuickActions';

export function DashboardHome() {
    const {
        isLoading,
        handleRefresh,
        todaySales,
        activeOrders,
        activeOrdersCount,
        placedCount,
        preparingCount,
        servedCount,
        tablesInUse,
        menuItemsCount,
        availableItemsCount,
        popularItems,
    } = useDashboard();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
                <Button
                    onClick={handleRefresh}
                    variant="outline"
                    disabled={isLoading}
                    className="h-9 px-4"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                    ) : (
                        <RefreshCw className="h-4 w-4 mr-2"/>
                    )}
                    Refresh
                </Button>
            </div>

            <Stats
                todaySales={todaySales}
                activeOrdersCount={activeOrdersCount}
                placedCount={placedCount}
                preparingCount={preparingCount}
                servedCount={servedCount}
                tablesInUse={tablesInUse}
                menuItemsCount={menuItemsCount}
                availableItemsCount={availableItemsCount}
                isLoading={isLoading}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <RecentOrders activeOrders={activeOrders} isLoading={isLoading}/>
                <PopularItems popularItems={popularItems} isLoading={isLoading}/>
            </div>

            <QuickActions/>
        </div>
    );
}
