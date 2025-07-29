import React from 'react';
import {Info} from 'lucide-react';

/**
 * Component for rendering an empty state when there are no active orders
 */
export const EmptyOrdersState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <Info className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true"/>
            <h3 className="text-lg font-medium">No Active Orders</h3>
            <p className="text-sm text-muted-foreground mt-2">There are no active orders to display.</p>
        </div>
    );
};