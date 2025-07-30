import {ClipboardList, Coffee, IndianRupee, Table2} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {StatsCard} from './StatsCard';

interface StatsProps {
    todaySales: number;
    activeOrdersCount: number;
    placedCount: number;
    preparingCount: number;
    servedCount: number;
    tablesInUse: number;
    menuItemsCount: number;
    availableItemsCount: number;
    isLoading: boolean;
}

export function Stats({
                          todaySales,
                          activeOrdersCount,
                          placedCount,
                          preparingCount,
                          servedCount,
                          tablesInUse,
                          menuItemsCount,
                          availableItemsCount,
                          isLoading
                      }: StatsProps) {
    const navigate = useNavigate();

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
                title="Today's Sales"
                value={`₹${todaySales.toFixed(2)}`}
                icon={<IndianRupee className="h-5 w-5"/>}
                description="Total revenue today"
                loading={isLoading}
                trend="up"
                onClick={() => navigate('/payments')}
            />

            <StatsCard
                title="Active Orders"
                value={activeOrdersCount.toString()}
                icon={<ClipboardList className="h-5 w-5"/>}
                description={`${placedCount} placed, ${preparingCount} preparing, ${servedCount} served`}
                loading={isLoading}
                onClick={() => navigate('/orders')}
            />

            <StatsCard
                title="Tables In Use"
                value={tablesInUse.toString()}
                icon={<Table2 className="h-5 w-5"/>}
                description={`${Math.round(tablesInUse / 20 * 100)}% occupancy rate`}
                loading={isLoading}
                onClick={() => navigate('/tables')}
            />

            <StatsCard
                title="Menu Items"
                value={menuItemsCount.toString()}
                icon={<Coffee className="h-5 w-5"/>}
                description={`${availableItemsCount} available`}
                loading={isLoading}
                onClick={() => navigate('/menu')}
            />
        </div>
    );
}
