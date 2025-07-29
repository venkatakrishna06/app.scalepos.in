import {Skeleton} from "@/components/ui/skeleton";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";

/**
 * Skeleton loader for the Menu page
 *
 * This component displays a skeleton UI that mimics the structure of the Menu page
 * while the actual data is being loaded.
 */
export function MenuSkeleton() {
    // Create an array of 8 items to represent loading menu item cards
    const skeletonCards = Array.from({length: 8}, (_, i) => i);

    return (
        <div className="space-y-6">
            {/* Page header skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-64"/>
                    <Skeleton className="mt-2 h-4 w-80"/>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-9 w-32"/>
                    <Skeleton className="h-9 w-32"/>
                </div>
            </div>

            {/* Filters skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                    <Skeleton className="h-10 w-full sm:w-64"/>
                    <Skeleton className="h-10 w-[180px]"/>
                    <Skeleton className="h-10 w-[180px]"/>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-[140px]"/>
                    <Skeleton className="h-10 w-10"/>
                </div>
            </div>

            {/* Menu items grid skeleton */}
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {skeletonCards.map((index) => (
                    <Card key={index} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-32"/>
                                    <Skeleton className="h-5 w-24"/>
                                </div>
                                <Skeleton className="h-8 w-8 rounded-full"/>
                            </div>
                            <Skeleton className="mt-1 h-4 w-full"/>
                            <Skeleton className="mt-1 h-4 w-3/4"/>
                        </CardHeader>

                        <CardContent className="pb-3">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-20 w-20 rounded-md"/>
                                <div>
                                    <Skeleton className="h-4 w-32"/>
                                    <Skeleton className="mt-2 h-6 w-16"/>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex items-center justify-end gap-2 border-t pt-3">
                            <Skeleton className="h-9 w-20"/>
                            <Skeleton className="h-9 w-24"/>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}