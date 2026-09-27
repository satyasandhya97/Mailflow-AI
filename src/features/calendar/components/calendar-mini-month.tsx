"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/context/calendar-provider";
import {
  eventCountsByDate,
  getMonthDays,
  getWeekOffsetForDate,
} from "@/features/calendar/lib/calendar-mini-month.utils";
import { calendarUi } from "@/features/calendar/lib/calendar-theme";
import type { CalendarEvent } from "@/features/calendar/types";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type CalendarMiniMonthProps = {
  events: CalendarEvent[];
};

export function CalendarMiniMonth({ events }: CalendarMiniMonthProps) {
  const { week, setWeekOffset } = useCalendar();
  const [displayMonth, setDisplayMonth] = useState(() => ({
    year: week.start.getFullYear(),
    month: week.start.getMonth(),
  }));

  const todayKey = useMemo(() => new Date().toDateString(), []);
  const eventCounts = useMemo(() => eventCountsByDate(events), [events]);
  const days = useMemo(
    () => getMonthDays(displayMonth.year, displayMonth.month),
    [displayMonth.year, displayMonth.month],
  );

  const monthLabel = new Date(
    displayMonth.year,
    displayMonth.month,
    1,
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    setDisplayMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function selectDate(date: Date) {
    setWeekOffset(getWeekOffsetForDate(date));
    setDisplayMonth({ year: date.getFullYear(), month: date.getMonth() });
  }

  return (
    <div className="rounded-xl border border-border/50 bg-[var(--cream-lifted)] p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold tracking-tight text-[var(--teal-900)]">
          {monthLabel}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="pb-1 text-[10px] font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}

        {days.map((date, i) => {
          if (!date) {
            return <span key={`empty-${i}`} className="aspect-square" />;
          }

          const dateKey = date.toDateString();
          const isToday = dateKey === todayKey;
          const count = eventCounts.get(dateKey) ?? 0;
          const inCurrentWeek = date >= week.start && date < week.end;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => selectDate(date)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-full text-xs transition-colors",
                inCurrentWeek && !isToday && "bg-[var(--brand-tint)]/60",
                !isToday && "hover:bg-[var(--brand-tint)]",
                isToday && calendarUi.todayBadge,
              )}
            >
              {date.getDate()}
              {count > 0 && !isToday && (
                <span className="absolute bottom-0.5 size-1 rounded-full bg-[var(--brand)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
