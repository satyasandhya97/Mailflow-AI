import { CalendarSkeletonSurface } from "@/features/calendar/components/skeletons/calendar-skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";

export function CalendarAvailabilitySkeleton() {
  return (
    <CalendarSkeletonSurface aria-label="Loading availability">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-8 w-14 rounded-md" />
      </div>
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </CalendarSkeletonSurface>
  );
}
