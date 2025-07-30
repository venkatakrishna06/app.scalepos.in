import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {ArrowRight, ArrowUpRight, ClipboardList, Clock, ShoppingBag, Table2} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {Order} from '@/types';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {Badge} from '@/components/ui/badge';

interface RecentOrdersProps {
    activeOrders: Order[];
    isLoading: boolean;
}

export function RecentOrders({activeOrders, isLoading}: RecentOrdersProps) {
    const navigate = useNavigate();

    return (
        <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                    <CardDescription>
                        Your most recent active orders
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate('/orders')}
                >
                    <ArrowUpRight className="h-4 w-4"/>
                    <span className="sr-only">View all orders</span>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center justify-between pb-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full"/>
                                    <div>
                                        <Skeleton className="h-4 w-40 mb-2"/>
                                        <Skeleton className="h-3 w-24"/>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-16"/>
                                    <Skeleton className="h-6 w-12"/>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeOrders.length > 0 ? (
                    <div className="space-y-4">
                        {activeOrders.slice(0, 5).map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between border-b pb-4 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                                onClick={() => navigate(`/orders?id=${order.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full",
                                        order.status === 'placed' ? "bg-blue-100" :
                                            order.status === 'preparing' ? "bg-yellow-100" :
                                                "bg-green-100"
                                    )}>
                                        {order.order_type === 'dine-in' ? (
                                            <Table2 className={cn(
                                                "h-5 w-5",
                                                order.status === 'placed' ? "text-blue-700" :
                                                    order.status === 'preparing' ? "text-yellow-700" :
                                                        "text-green-700"
                                            )}/>
                                        ) : (
                                            <ShoppingBag className={cn(
                                                "h-5 w-5",
                                                order.status === 'placed' ? "text-blue-700" :
                                                    order.status === 'preparing' ? "text-yellow-700" :
                                                        "text-green-700"
                                            )}/>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {order.order_type === 'dine-in' ? `Table ${order.table_id}` : 'Takeaway'} -
                                            #{order.id}
                                        </p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Clock className="mr-1 h-3 w-3"/>
                                            {new Date(order.order_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(
                                        "capitalize",
                                        order.status === 'placed' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                                            order.status === 'preparing' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                                order.status === 'served' ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                                    "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                    )}>
                                        {order.status}
                                    </Badge>
                                    <span
                                        className="font-medium text-sm">₹{order.total_amount?.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ClipboardList className="h-12 w-12 text-muted-foreground mb-3"/>
                        <h3 className="text-lg font-medium">No active orders</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            All orders have been completed or cancelled
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/orders')}>
                    View All Orders
                    <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </CardFooter>
        </Card>
    );
}
