"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";

import { calendarEventHref } from "@/features/calendar/lib/calendar-routes";
import {
  formatEventTimeRange,
  getCurrentTimeTopPercent,
  getEventTimeRange,
  HOUR_LABELS,
  MIN_HOUR_ROW_PX,
  type PositionedEvent,
} from "@/features/calendar/lib/calendar-grid.utils";
import { cn } from "@/lib/utils";

type CalendarGridEventBlockProps = {
  item: PositionedEvent;
};

export const CalendarGridEventBlock = memo(function CalendarGridEventBlock({
  item,
}: CalendarGridEventBlockProps) {
  const router = useRouter();
  const { event, topPct, heightPct, column, columnCount, color, tint } = item;
  const widthPct = 100 / columnCount;
  const leftPct = column * widthPct;

  const range = getEventTimeRange(event);
  const timeLabel = range ? formatEventTimeRange(range.start, range.end) : "";

  const navigate = () => {
    router.push(calendarEventHref(event.id));
  };

  return (
    <button
      type="button"
      onClick={navigate}
      className="pointer-events-auto absolute z-10 min-h-[28px] overflow-hidden rounded-md border-l-[3px] px-2 py-1.5 text-left shadow-sm transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-md"
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        backgroundColor: tint,
        borderLeftColor: color,
      }}
    >
      <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
        {event.summary || "Untitled"}
      </p>
      {heightPct > 4 && timeLabel && (
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {timeLabel}
        </p>
      )}
    </button>
  );
});

type CalendarGridTimeGutterProps = {
  className?: string;
};

export const CalendarGridTimeGutter = memo(function CalendarGridTimeGutter({
  className,
}: CalendarGridTimeGutterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col border-r border-border/40 pt-2",
        className,
      )}
    >
      {HOUR_LABELS.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className="relative flex shrink-0 items-start justify-end border-b border-border/30 pr-2"
          style={{ height: MIN_HOUR_ROW_PX, minHeight: MIN_HOUR_ROW_PX }}
        >
          <span className="-translate-y-1/2 text-[11px] leading-none text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
});

type CalendarGridDayColumnProps = {
  isWeekend: boolean;
  isToday: boolean;
  events: PositionedEvent[];
};

export const CalendarGridDayColumn = memo(function CalendarGridDayColumn({
  isWeekend,
  isToday,
  events,
}: CalendarGridDayColumnProps) {
  const nowLineTop = isToday ? getCurrentTimeTopPercent() : null;

  return (
    <div
      className={cn(
        "relative shrink-0 flex-col border-r border-border/40 last:border-r-0",
        isWeekend && "bg-[var(--teal-50)]/40",
      )}
      style={{ height: HOUR_LABELS.length * MIN_HOUR_ROW_PX }}
    >
      {HOUR_LABELS.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className="shrink-0 border-b border-border/30"
          style={{ height: MIN_HOUR_ROW_PX, minHeight: MIN_HOUR_ROW_PX }}
        />
      ))}

      {nowLineTop != null && (
        <div
          className="pointer-events-none absolute right-0 left-0 z-20"
          style={{ top: `${nowLineTop}%` }}
        >
          <div className="relative h-0.5 bg-[var(--signal)]">
            <span className="absolute -top-[5px] -left-[5px] size-2.5 rounded-full bg-[var(--signal)] ring-2 ring-[var(--cream-lifted)]" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        {events.map((item) => (
          <CalendarGridEventBlock key={item.event.id} item={item} />
        ))}
      </div>
    </div>
  );
});
