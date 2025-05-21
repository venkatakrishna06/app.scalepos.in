import {cn} from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Skeleton component for loading states
 * 
 * This component renders a pulsing placeholder that can be used to indicate
 * that content is loading. It accepts all standard HTML div attributes.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}
