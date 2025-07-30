import {Skeleton} from "@/components/ui/skeleton";
import {Card} from "@/components/ui/card";
import {cn} from "@/lib/utils";

/**
 * Skeleton loader for the Takeaway and Quick Bill pages
 *
 * This component displays a skeleton UI that mimics the structure of the DashboardTakeaway component
 * while the actual data is being loaded.
 */
export function TakeawaySkeleton({type = 'takeaway'}: { type?: 'takeaway' | 'quick-bill' }) {
    // Create arrays for skeleton items
    const categorySkeleton = Array.from({length: 8}, (_, i) => i);
    const menuItemSkeleton = Array.from({length: 12}, (_, i) => i);

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-1">
            {/* Mobile header skeleton */}
            <div className="flex items-center md:hidden p-2 border-b">
                <Skeleton className="h-8 w-8 absolute left-2"/>
                <Skeleton className="h-6 w-48 mx-auto" title={type === 'quick-bill' ? 'Quick Bill' : 'Takeaway Order'}/>
            </div>

            {/* Categories Sidebar Skeleton */}
            <div className="border-b bg-muted p-2 md:w-48 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between mb-2 md:hidden">
                    <Skeleton className="h-5 w-24"/>
                    <Skeleton className="h-8 w-8"/>
                </div>

                <div className="mb-2 space-y-1">
                    <Skeleton className="h-9 w-full rounded-md"/>
                    <Skeleton className="h-9 w-full rounded-md"/>
                </div>

                <div className="space-y-1">
                    {categorySkeleton.map((index) => (
                        <Skeleton key={index} className="h-9 w-full rounded-md"/>
                    ))}
                </div>
            </div>

            {/* Menu Items and Order Summary */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                {/* Menu Items Section */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="sticky top-0 z-10 bg-background p-2 xs:p-3 sm:p-3 shrink-0">
                        <div className="flex items-center gap-2 md:hidden mb-2">
                            <Skeleton className="h-8 w-32"/>
                        </div>
                        <Skeleton className="h-9 w-full rounded-md"/>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-3 pt-0">
                        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 auto-rows-max">
                            {menuItemSkeleton.map((index) => (
                                <Card key={index} className="overflow-hidden border-primary/10">
                                    <div className="p-2 sm:p-3">
                                        <div className="min-w-0">
                                            <Skeleton className="h-4 w-full mb-1"/>
                                            <Skeleton className="h-4 w-3/4"/>
                                            <div className="mt-2 flex items-center justify-between">
                                                <Skeleton className="h-4 w-16"/>
                                                <Skeleton className="h-4 w-12 rounded-full"/>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary Section */}
                <div className={cn(
                    "border-t bg-muted md:w-[30rem] md:border-l md:border-t-0 flex flex-col overflow-hidden",
                    "md:relative md:flex shrink-0"
                )}>
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header skeleton */}
                        <div className="p-3 shrink-0">
                            <Skeleton className="h-6 w-32"/>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-3">
                            <div className="space-y-2">
                                {/* Empty cart placeholder */}
                                <div
                                    className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-4">
                                    <Skeleton className="h-8 w-8 mb-2"/>
                                    <Skeleton className="h-4 w-32 mb-1"/>
                                    <Skeleton className="h-3 w-48"/>
                                </div>

                                {/* Payment section skeleton */}
                                <div className="mt-4 space-y-2">
                                    <Skeleton className="h-10 w-full"/>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24"/>
                                        <Skeleton className="h-4 w-16"/>
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24"/>
                                        <Skeleton className="h-4 w-16"/>
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-28"/>
                                        <Skeleton className="h-5 w-20"/>
                                    </div>
                                    <Skeleton className="h-10 w-full mt-2"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}