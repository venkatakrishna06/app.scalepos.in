import React, { useState } from 'react';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  Coffee,
  Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Order } from '@/types';

interface KitchenViewProps {
  orders: Order[];
  onItemStatusChange: (orderId: number, itemId: number, newStatus: string) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  orders,
  onItemStatusChange
}) => {
  // State for filter parameters
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  // Extract all items with status 'placed' or 'preparing' from all orders
  const kitchenItems = orders.flatMap(order => {
    return (order.items || [])
      .filter(item => item.status === 'placed' || item.status === 'preparing')
      .map(item => ({
        ...item,
        orderId: order.id,
        orderTime: order.order_time,
        tableNumber: order.table?.table_number,
        orderType: order.order_type
      }));
  });

  // Filter items based on search query
  const filteredItems = kitchenItems.filter(item => {
    const itemName = item.name || '';
    const orderIdText = `Order #${item.orderId}`;
    const tableText = item.tableNumber ? `Table ${item.tableNumber}` : '';

    return searchQuery === '' || (
      itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orderIdText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tableText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Group items by status
  const placedItems = filteredItems.filter(item => item.status === 'placed');
  const preparingItems = filteredItems.filter(item => item.status === 'preparing');

  return (
    <div className="space-y-6">
      {/* Page header with title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-yellow-800 dark:text-yellow-300">Kitchen View</h1>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by item name, order #, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-yellow-200 focus-visible:ring-yellow-400"
            />
          </div>
        </div>
      </div>

      {/* Kitchen items display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placed Items Section */}
        <div className="space-y-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md">
            <h2 className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
              <span>PLACED ITEMS</span>
              <Badge className="ml-2 bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                {placedItems.length}
              </Badge>
            </h2>
          </div>

          {placedItems.length > 0 ? (
            <div className="space-y-3">
              {placedItems.map((item) => (
                <Card key={`${item.orderId}-${item.id}`} className="overflow-hidden border-yellow-200 hover:shadow-md">
                  <CardHeader className="p-3 pb-2 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                          Order #{item.orderId}
                        </Badge>
                        {item.tableNumber ? (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                            Table {item.tableNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                            {item.orderType === 'takeaway' ? 'Takeaway' : 'Quick Bill'}
                          </Badge>
                        )}
                        <span className="text-xs text-yellow-600">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatTime(item.orderTime)}
                        </span>
                      </div>
                      <Badge className={cn(getStatusBadgeStyles(item.status))}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-yellow-600">×{item.quantity}</span>
                        </div>
                        {item.notes && (
                          <div className="mt-1 text-sm text-muted-foreground bg-yellow-50 p-1 rounded-sm border border-yellow-100">
                            <span className="font-medium">Notes:</span> {item.notes}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-300 hover:bg-yellow-100 text-yellow-700"
                        onClick={() => onItemStatusChange(item.orderId, item.id, 'preparing')}
                        disabled={item.allowed_next_states && !item.allowed_next_states.includes('preparing')}
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        Start Preparing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-yellow-200 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-yellow-400" />
              <h3 className="mt-2 text-lg font-semibold text-yellow-800">No Placed Items</h3>
              <p className="mt-1 text-sm text-yellow-600">
                There are no items waiting to be prepared
              </p>
            </div>
          )}
        </div>

        {/* Preparing Items Section */}
        <div className="space-y-4">
          <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-md">
            <h2 className="font-semibold text-orange-800 dark:text-orange-200 flex items-center">
              <span>PREPARING ITEMS</span>
              <Badge className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                {preparingItems.length}
              </Badge>
            </h2>
          </div>

          {preparingItems.length > 0 ? (
            <div className="space-y-3">
              {preparingItems.map((item) => (
                <Card key={`${item.orderId}-${item.id}`} className="overflow-hidden border-orange-200 hover:shadow-md">
                  <CardHeader className="p-3 pb-2 bg-orange-50 dark:bg-orange-950 border-b border-orange-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          Order #{item.orderId}
                        </Badge>
                        {item.tableNumber ? (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Table {item.tableNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            {item.orderType === 'takeaway' ? 'Takeaway' : 'Quick Bill'}
                          </Badge>
                        )}
                        <span className="text-xs text-orange-600">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatTime(item.orderTime)}
                        </span>
                      </div>
                      <Badge className={cn(getStatusBadgeStyles(item.status))}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-orange-600">×{item.quantity}</span>
                        </div>
                        {item.notes && (
                          <div className="mt-1 text-sm text-muted-foreground bg-orange-50 p-1 rounded-sm border border-orange-100">
                            <span className="font-medium">Notes:</span> {item.notes}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-100 text-green-700"
                        onClick={() => onItemStatusChange(item.orderId, item.id, 'ready')}
                        disabled={item.allowed_next_states && !item.allowed_next_states.includes('ready')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Ready
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-orange-200 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-orange-400" />
              <h3 className="mt-2 text-lg font-semibold text-orange-800">No Items Being Prepared</h3>
              <p className="mt-1 text-sm text-orange-600">
                There are no items currently being prepared
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
