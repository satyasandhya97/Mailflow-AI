import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  GRID_COLS,
  GRID_TOTAL_HOURS,
  HOUR_LABELS,
  MIN_HOUR_ROW_PX,
} from "@/features/calendar/lib/calendar-grid.utils";
import { cn } from "@/lib/utils";

const EVENT_PLACEHOLDERS = [
  { col: 0, top: "14%", height: "12%" },
  { col: 1, top: "24%", height: "10%" },
  { col: 2, top: "18%", height: "15%" },
  { col: 4, top: "32%", height: "11%" },
  { col: 5, top: "20%", height: "13%" },
] as const;

type CalendarSkeletonSurfaceProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function CalendarSkeletonSurface({
  children,
  className,
  "aria-label": ariaLabel = "Loading calendar",
}: CalendarSkeletonSurfaceProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)] shadow-sm",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function CalendarSkeletonToolbar() {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
      <Skeleton className="h-8 w-16 rounded-full" />
      <Skeleton className="size-8 rounded-md" />
      <Skeleton className="size-8 rounded-md" />
      <Skeleton className="h-4 w-36 max-w-[40%]" />
      <div className="ml-auto flex gap-2">
        <Skeleton className="hidden size-8 rounded-md sm:block" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function CalendarSkeletonDayHeaders() {
  return (
    <div className={cn("grid shrink-0 border-b border-border/60", GRID_COLS)}>
      <div className="border-r border-border/40" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "border-r border-border/40 px-2 py-2.5 text-center last:border-r-0",
            i >= 5 && "bg-[var(--teal-50)]/30",
          )}
        >
          <Skeleton className="mx-auto h-2.5 w-7 rounded-sm" />
          <Skeleton className="mx-auto mt-2 size-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function CalendarSkeletonHourGutter() {
  return (
    <div className="flex shrink-0 flex-col border-r border-border/40 pt-2">
      {HOUR_LABELS.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className="relative flex shrink-0 items-start justify-end border-b border-border/30 pr-2"
          style={{ height: MIN_HOUR_ROW_PX, minHeight: MIN_HOUR_ROW_PX }}
        >
          <Skeleton className="h-2.5 w-9 rounded-sm opacity-40" />
        </div>
      ))}
    </div>
  );
}

function CalendarSkeletonDayColumn({ colIndex }: { colIndex: number }) {
  const isWeekend = colIndex >= 5;
  const events = EVENT_PLACEHOLDERS.filter((e) => e.col === colIndex);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col border-r border-border/40 last:border-r-0",
        isWeekend && "bg-[var(--teal-50)]/20",
      )}
    >
      {HOUR_LABELS.map((label) => (
        <div key={label} className="min-h-0 flex-1 border-b border-border/30" />
      ))}
      <div className="pointer-events-none absolute inset-0">
        {events.map((event) => (
          <Skeleton
            key={`${event.col}-${event.top}`}
            className="absolute left-1 rounded-md opacity-70"
            style={{
              top: event.top,
              height: event.height,
              width: "calc(100% - 8px)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeletonHourGrid() {
  return (
    <div
      className="min-h-0 flex-1 overflow-hidden"
      style={{ minHeight: GRID_TOTAL_HOURS * MIN_HOUR_ROW_PX }}
    >
      <div className={cn("grid h-full min-h-full", GRID_COLS)}>
        <CalendarSkeletonHourGutter />
        {Array.from({ length: 7 }).map((_, col) => (
          <CalendarSkeletonDayColumn key={col} colIndex={col} />
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeletonWeekGrid() {
  return (
    <CalendarSkeletonSurface>
      <CalendarSkeletonToolbar />
      <CalendarSkeletonDayHeaders />
      <CalendarSkeletonHourGrid />
    </CalendarSkeletonSurface>
  );
}
