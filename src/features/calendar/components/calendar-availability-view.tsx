"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarAvailabilitySkeleton } from "@/features/calendar/components/skeletons";
import { useCalendar } from "@/features/calendar/context/calendar-provider";
import { CALENDAR_AVAILABILITY_STALE_MS } from "@/features/calendar/lib/calendar-query-options";
import { formatEventWhen } from "@/features/calendar/lib/display";
import { api } from "@/trpc/react";

export function CalendarAvailabilityView() {
  const { weekLabel, calendarId, setWeekOffset, weekStartIso, weekEndIso } =
    useCalendar();

  const availability = api.calendar.getAvailability.useQuery(
    {
      timeMin: weekStartIso,
      timeMax: weekEndIso,
      calendarIds: [calendarId],
    },
    { staleTime: CALENDAR_AVAILABILITY_STALE_MS },
  );

  const busyBlocks = availability.data?.busyBlocks ?? [];

  if (availability.isLoading) {
    return <CalendarAvailabilitySkeleton />;
  }

  if (availability.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {availability.error.message}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)] shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Find time</h2>
          <p className="text-xs text-muted-foreground">{weekLabel}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => availability.refetch()}
          disabled={availability.isFetching}
          aria-label="Refresh availability"
        >
          <RefreshCw
            className={cn("size-4", availability.isFetching && "animate-spin")}
          />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
          Today
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {busyBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-lg font-medium text-[var(--teal-900)]">
              Wide open
            </p>
            <p className="text-sm text-muted-foreground">
              No busy blocks this week on the selected calendar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {busyBlocks.map((block, i) => (
              <div
                key={`${block.start}-${i}`}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-background/60 px-4 py-3"
              >
                <span className="size-2 shrink-0 rounded-full bg-[var(--brand)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Busy</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventWhen(block.start, block.end)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
