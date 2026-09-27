import {
  CalendarSkeletonSurface,
  CalendarSkeletonToolbar,
} from "@/features/calendar/components/skeletons/calendar-skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";

export function CalendarEventDetailSkeleton() {
  return (
    <CalendarSkeletonSurface aria-label="Loading event">
      <CalendarSkeletonToolbar />
      <div className="space-y-5 px-6 py-8">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-24 w-full max-w-lg rounded-lg" />
      </div>
    </CalendarSkeletonSurface>
  );
}
