import { CalendarSidebarSkeleton } from "@/features/calendar/components/skeletons/calendar-sidebar-skeleton";
import { CalendarSkeletonWeekGrid } from "@/features/calendar/components/skeletons/calendar-skeleton-primitives";

export function CalendarShellLayoutSkeleton({
  showSidebar = true,
  ariaLabel = "Loading calendar",
}: {
  showSidebar?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 gap-4 overflow-hidden"
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {showSidebar && <CalendarSidebarSkeleton className="hidden lg:flex" />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CalendarSkeletonWeekGrid />
      </div>
    </div>
  );
}

export function CalendarShellConnectionSkeleton() {
  return (
    <CalendarShellLayoutSkeleton ariaLabel="Checking Calendar connection" />
  );
}

export function CalendarShellFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--cream-canvas)]">
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        <CalendarShellLayoutSkeleton ariaLabel="Loading Calendar" />
      </div>
    </div>
  );
}
