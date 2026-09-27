"use client";

import { addMinutes } from "date-fns";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/features/calendar/components/date-time-field";
import {
  DURATION_PRESETS,
  ensureEndAfterStart,
  isEndBeforeOrEqualStart,
} from "@/features/calendar/lib/calendar-datetime.utils";
import { cn } from "@/lib/utils";

type EventDateTimeRangeProps = {
  start: Date;
  end: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
  disabled?: boolean;
};

export function EventDateTimeRange({
  start,
  end,
  onStartChange,
  onEndChange,
  disabled,
}: EventDateTimeRangeProps) {
  const invalidRange = isEndBeforeOrEqualStart(start, end);
  const activeDuration = end.getTime() - start.getTime();

  function handleStartChange(nextStart: Date) {
    onStartChange(nextStart);
    if (isEndBeforeOrEqualStart(nextStart, end)) {
      onEndChange(addMinutes(nextStart, 60));
    }
  }

  function applyDuration(minutes: number) {
    onEndChange(addMinutes(start, minutes));
  }

  return (
    <section className="min-w-0 space-y-4 rounded-xl border border-border/50 bg-[var(--teal-50)]/40 p-4">
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-[var(--brand)]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          When
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeField
          id="event-start"
          label="Start"
          value={start}
          onChange={handleStartChange}
          disabled={disabled}
        />
        <DateTimeField
          id="event-end"
          label="End"
          value={ensureEndAfterStart(start, end)}
          onChange={onEndChange}
          disabled={disabled}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5 pt-1">
        <span className="mr-1 text-xs text-muted-foreground">Duration</span>
        {DURATION_PRESETS.map((preset) => {
          const isActive = activeDuration === preset.minutes * 60_000;
          return (
            <Button
              key={preset.minutes}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className={cn(
                "h-7 rounded-full border-border/60 bg-background px-3 text-xs font-medium shadow-none",
                isActive &&
                  "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--teal-900)] hover:bg-[var(--brand-tint)]",
              )}
              onClick={() => applyDuration(preset.minutes)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {invalidRange && (
        <p className="text-xs text-destructive">End time must be after start time.</p>
      )}
    </section>
  );
}
