import {Skeleton} from "@/components/ui/skeleton";

/**
 * Skeleton loader for the Payments page
 *
 * This component displays a skeleton UI that mimics the structure of the Payments page
 * while the actual data is being loaded.
 */
export function PaymentsSkeleton() {
    // Create an array of 8 items to represent loading payment rows
    const skeletonRows = Array.from({length: 8}, (_, i) => i);

    return (
        <div>
            {/* Page header skeleton */}
            <div className="mb-8 flex items-center justify-between">
                <Skeleton className="h-8 w-48"/>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-64"/>
                    <Skeleton className="h-10 w-36"/>
                </div>
            </div>

            {/* Table skeleton */}
            <div className="rounded-lg border bg-card shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-20"/>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-16"/>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-16"/>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-20"/>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-20"/>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-16"/>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-20"/>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {skeletonRows.map((index) => (
                            <tr key={index} className="border-b">
                                <td className="px-6 py-4">
                                    <Skeleton className="h-5 w-24"/>
                                </td>
                                <td className="px-6 py-4">
                                    <Skeleton className="h-5 w-20"/>
                                </td>
                                <td className="px-6 py-4">
                                    <Skeleton className="h-5 w-40"/>
                                </td>
                                <td className="px-6 py-4">
                                    <Skeleton className="h-5 w-20"/>
                                </td>
                                <td className="px-6 py-4">
                                    <Skeleton className="h-5 w-24"/>
                                </td>
                                <td className="px-6 py-4">
                                    <Skeleton className="h-5 w-32"/>
                                </td>
                                <td className="px-6 py-4">
                                    <Skeleton className="h-6 w-24 rounded-full"/>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}