import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import React from 'react';

interface StatsCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    description: string;
    loading?: boolean;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
}

export function StatsCard({title, value, icon, description, loading = false, trend, onClick}: StatsCardProps) {
    return (
        <Card
            className={cn(
                "overflow-hidden transition-all duration-200",
                onClick && "cursor-pointer hover:shadow-md hover:border-primary/50"
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={cn(
                    "rounded-full p-1",
                    trend === 'up' ? "bg-green-100" :
                        trend === 'down' ? "bg-red-100" :
                            "bg-muted"
                )}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-8 w-24 mb-1"/>
                        <Skeleton className="h-3 w-32"/>
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {description}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
