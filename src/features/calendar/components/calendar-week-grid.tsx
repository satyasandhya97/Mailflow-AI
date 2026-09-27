"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  CalendarGridDayColumn,
  CalendarGridTimeGutter,
} from "@/features/calendar/components/calendar-grid-event-block";
import { CalendarGridToolbar } from "@/features/calendar/components/calendar-grid-toolbar";
import { CalendarWeekGridSkeleton } from "@/features/calendar/components/skeletons/calendar-week-grid-skeleton";
import {
  GRID_COLS,
  GRID_TOTAL_HOURS,
  getCurrentTimeTopPercent,
  getDefaultScrollTopPercent,
  layoutWeekEvents,
  MIN_HOUR_ROW_PX,
} from "@/features/calendar/lib/calendar-grid.utils";
import { calendarUi } from "@/features/calendar/lib/calendar-theme";
import type { CalendarPaletteEntry } from "@/features/calendar/lib/calendar-theme";
import { getWeekDays } from "@/features/calendar/lib/week";
import type { CalendarEvent } from "@/features/calendar/types";
import { cn } from "@/lib/utils";

type CalendarWeekGridProps = {
  events: CalendarEvent[];
  weekStart: Date;
  weekLabel: string;
  weekOffset: number;
  palette: CalendarPaletteEntry;
  isLoading: boolean;
  error: { message: string } | null;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNewEvent: () => void;
};

export function CalendarWeekGrid({
  events,
  weekStart,
  weekLabel,
  weekOffset,
  palette,
  isLoading,
  error,
  onPreviousWeek,
  onNextWeek,
  onThisWeek,
  onRefresh,
  isRefreshing,
  onNewEvent,
}: CalendarWeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const todayKey = new Date().toDateString();

  const { timedByDay, allDay } = useMemo(
    () => layoutWeekEvents(events, weekStart, palette),
    [events, weekStart, palette],
  );

  const minGridHeight = GRID_TOTAL_HOURS * MIN_HOUR_ROW_PX;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const topPct =
      weekOffset === 0
        ? (getCurrentTimeTopPercent() ?? getDefaultScrollTopPercent())
        : getDefaultScrollTopPercent();

    const scrollTarget =
      (container.scrollHeight * topPct) / 100 - container.clientHeight / 3;
    container.scrollTop = Math.max(0, scrollTarget);
  }, [weekOffset, weekStart]);

  if (isLoading && events.length === 0) {
    return <CalendarWeekGridSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)] shadow-sm">
      <CalendarGridToolbar
        weekLabel={weekLabel}
        onPrevious={onPreviousWeek}
        onNext={onNextWeek}
        onToday={onThisWeek}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onNewEvent={onNewEvent}
      />

      {allDay.length > 0 && (
        <div className="flex shrink-0 border-b border-border/60 bg-[var(--brand-tint)]/30 px-4 py-2">
          <span className="w-14 shrink-0 text-[10px] font-medium uppercase text-muted-foreground">
            All day
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
            {allDay.map((event) => (
              <span
                key={event.id}
                className="rounded-md border-l-[3px] px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: palette.tint,
                  borderLeftColor: palette.color,
                }}
              >
                {event.summary || "Untitled"}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            "grid shrink-0 border-b border-border/60 bg-[var(--cream-lifted)]",
            GRID_COLS,
          )}
        >
          <div className="border-r border-border/40" />
          {days.map((date, i) => {
            const isToday = date.toDateString() === todayKey;
            const isWeekend = i >= 5;

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "border-r border-border/40 px-2 py-2.5 text-center last:border-r-0",
                  isWeekend && "bg-[var(--teal-50)]/50",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "mx-auto mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                    isToday && calendarUi.todayBadge,
                  )}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        >
          <div
            className={cn("grid", GRID_COLS)}
            style={{ minHeight: minGridHeight, height: minGridHeight }}
          >
            <CalendarGridTimeGutter />

            {days.map((date, dayIndex) => (
              <CalendarGridDayColumn
                key={date.toISOString()}
                isWeekend={dayIndex >= 5}
                isToday={date.toDateString() === todayKey}
                events={timedByDay[dayIndex] ?? []}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
