"use client";

import { CalendarAvailabilityView } from "@/features/calendar/components/calendar-availability-view";
import { CalendarWeekGrid } from "@/features/calendar/components/calendar-week-grid";
import { useCalendar } from "@/features/calendar/context/calendar-provider";
import { resolveCalendarPaletteById } from "@/features/calendar/lib/calendar-theme";

export function CalendarView() {
  const calendar = useCalendar();
  const calendarIds = calendar.calendarList.map((c) => c.id);
  const palette = resolveCalendarPaletteById(calendar.calendarId, calendarIds);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <CalendarWeekGrid
        events={calendar.eventsList}
        weekStart={calendar.week.start}
        weekLabel={calendar.weekLabel}
        weekOffset={calendar.weekOffset}
        palette={palette}
        isLoading={calendar.eventsLoading}
        error={calendar.eventsError}
        onPreviousWeek={() => calendar.setWeekOffset((w) => w - 1)}
        onNextWeek={() => calendar.setWeekOffset((w) => w + 1)}
        onThisWeek={() => calendar.setWeekOffset(0)}
        onRefresh={() =>
          calendar.refreshEvents.mutate({
            weekStart: calendar.weekStartIso,
            weekEnd: calendar.weekEndIso,
            calendarId: calendar.calendarId,
          })
        }
        isRefreshing={calendar.refreshEvents.isPending}
        onNewEvent={calendar.openInvite}
      />
    </div>
  );
}

export function CalendarAvailabilityPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <CalendarAvailabilityView />
    </div>
  );
}
