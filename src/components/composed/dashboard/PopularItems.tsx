
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight, Coffee, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MenuItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PopularItemsProps {
    popularItems: (MenuItem & { orderCount: number })[];
    isLoading: boolean;
}

export function PopularItems({ popularItems, isLoading }: PopularItemsProps) {
    const navigate = useNavigate();

    return (
        <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-semibold">Popular Items</CardTitle>
                    <CardDescription>
                        Your most ordered menu items
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate('/menu')}
                >
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="sr-only">View all menu items</span>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center justify-between pb-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-md" />
                                    <div>
                                        <Skeleton className="h-4 w-32 mb-2" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                ) : popularItems.length > 0 ? (
                    <div className="space-y-4">
                        {popularItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between border-b pb-4 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                                onClick={() => navigate(`/menu?id=${item.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-12 w-12 rounded-md object-cover border"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=No+Image";
                                        }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                        <span>{item.orderCount}</span>
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Coffee className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No popular items</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Start taking orders to see popular items
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/menu')}>
                    Manage Menu Items
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
