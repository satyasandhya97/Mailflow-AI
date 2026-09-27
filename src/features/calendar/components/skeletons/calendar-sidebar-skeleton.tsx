import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = 7;
const MONTH_ROWS = 6;

export function CalendarSidebarSkeleton({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex w-[240px] shrink-0 flex-col gap-5 overflow-hidden",
        className,
      )}
    >
      <div className="rounded-xl border border-border/50 bg-[var(--cream-lifted)] p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: WEEKDAY_LABELS }).map((_, i) => (
            <Skeleton key={`wd-${i}`} className="mx-auto h-2 w-2 rounded-sm" />
          ))}
          {Array.from({ length: MONTH_ROWS * WEEKDAY_LABELS }).map((_, i) => (
            <Skeleton key={`day-${i}`} className="mx-auto aspect-square w-6 rounded-full" />
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-2.5 w-24 px-1" />
        <div className="flex flex-col gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="size-3 rounded-sm" />
              <Skeleton className="h-3.5 flex-1 max-w-[8rem]" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg px-2 py-2">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-3.5 w-16" />
      </div>
    </aside>
  );
}

export function CalendarSidebarCalendarsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="size-3 rounded-sm" />
          <Skeleton className="h-3.5 flex-1 max-w-[8rem]" />
        </div>
      ))}
    </div>
  );
}
