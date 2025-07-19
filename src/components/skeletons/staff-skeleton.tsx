import {Skeleton} from "@/components/ui/skeleton";

/**
 * Skeleton loader for the Staff page
 *
 * This component displays a skeleton UI that mimics the structure of the Staff page
 * while the actual data is being loaded.
 */
export function StaffSkeleton() {
    // Create an array of 6 items to represent loading staff cards
    const skeletonCards = Array.from({length: 6}, (_, i) => i);

    return (
        <div>
            {/* Page header skeleton */}
            <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <Skeleton className="h-8 w-48"/>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-32"/>
                        <Skeleton className="h-10 w-32"/>
                    </div>
                    <Skeleton className="h-10 w-full sm:max-w-xs"/>
                </div>
            </div>

            {/* Staff grid skeleton */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {skeletonCards.map((index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden rounded-xl border bg-card shadow-sm"
                    >
                        {/* Role badge skeleton */}
                        <Skeleton className="absolute right-0 top-0 h-6 w-20"/>

                        <div className="p-4 sm:p-6">
                            {/* Avatar and name section skeleton */}
                            <div
                                className="flex flex-col sm:flex-row items-center text-center sm:text-left sm:items-start gap-4 mb-4">
                                <Skeleton className="h-20 w-20 sm:h-16 sm:w-16 rounded-full"/>
                                <div>
                                    <Skeleton className="h-6 w-32"/>
                                    <Skeleton className="mt-1 h-5 w-16"/>
                                </div>
                            </div>

                            {/* Staff details skeleton */}
                            <div className="space-y-3 border-t pt-3 mt-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Skeleton className="h-4 w-4"/>
                                    <Skeleton className="h-4 w-16"/>
                                    <Skeleton className="h-4 w-24"/>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Skeleton className="h-4 w-4"/>
                                    <Skeleton className="h-4 w-16"/>
                                    <Skeleton className="h-4 w-24"/>
                                </div>
                            </div>

                            {/* Action buttons skeleton */}
                            <div className="mt-6 flex gap-2">
                                <Skeleton className="flex-1 h-10"/>
                                <Skeleton className="flex-1 h-10"/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}