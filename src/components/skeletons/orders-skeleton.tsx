import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the Orders page
 * 
 * This component displays a skeleton UI that mimics the structure of the Orders page
 * while the actual data is being loaded.
 */
export function OrdersSkeleton() {
  // Create an array of 6 items to represent loading order cards
  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="mt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full sm:w-64" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Orders grid skeleton */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {skeletonCards.map((index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="mt-1 h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-44" />
              </div>

              <div className="mt-4 rounded-md border">
                <Skeleton className="h-[120px] w-full" />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t pt-3">
              <Skeleton className="h-8 w-8" />
              <div className="text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-6 w-24 mt-1 ml-auto" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}