import {Skeleton} from "@/components/ui/skeleton";

/**
 * Skeleton loader for the Tables page
 *
 * This component displays a skeleton UI that mimics the structure of the Tables page
 * while the actual data is being loaded.
 */
export function TablesSkeleton() {
    // Create an array of 8 items to represent loading table cards
    const skeletonCards = Array.from({length: 8}, (_, i) => i);

    return (
        <div className="space-y-6">
            {/* Page header skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-64"/>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-36"/>
                    <Skeleton className="h-10 w-32"/>
                </div>
            </div>

            {/* Filters skeleton */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <Skeleton className="h-10 w-[180px]"/>
                <Skeleton className="h-10 w-[180px]"/>
                <Skeleton className="h-10 w-full md:w-64"/>
            </div>

            {/* Tables grid skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {skeletonCards.map((index) => (
                    <div key={index} className="rounded-lg border shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="h-6 w-24"/>
                                <Skeleton className="h-5 w-20"/>
                            </div>

                            <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-full"/>
                                <Skeleton className="h-4 w-3/4"/>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-9 rounded-md"/>
                                    <Skeleton className="h-9 w-9 rounded-md"/>
                                    <Skeleton className="h-9 w-9 rounded-md"/>
                                </div>
                                <Skeleton className="h-9 w-24"/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}