"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { CalendarSidebarCalendarsSkeleton } from "@/features/calendar/components/skeletons";
import { cn } from "@/lib/utils";
import { CalendarMiniMonth } from "@/features/calendar/components/calendar-mini-month";
import { useCalendar } from "@/features/calendar/context/calendar-provider";
import {
  calendarAvailabilityHref,
  calendarWeekHref,
  type CalendarPathState,
} from "@/features/calendar/lib/calendar-routes";
import {
  calendarUi,
  resolveCalendarPalette,
} from "@/features/calendar/lib/calendar-theme";

type CalendarShellSidebarProps = {
  route: CalendarPathState;
};

export function CalendarShellSidebar({ route }: CalendarShellSidebarProps) {
  const { calendarList, calendarId, setCalendarId, eventsList, calendarsLoading } =
    useCalendar();

  return (
    <aside className="flex w-[240px] shrink-0 flex-col gap-5 overflow-y-auto pr-1">
      <CalendarMiniMonth events={eventsList} />

      <div>
        <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          My calendars
        </p>
        <div className="flex flex-col gap-1">
          {calendarsLoading && <CalendarSidebarCalendarsSkeleton rows={3} />}
          {calendarList.map((cal, index) => {
            const checked = calendarId === cal.id;
            const palette = resolveCalendarPalette(index);

            return (
              <label
                key={cal.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--brand-tint)]/50",
                  checked && "bg-[var(--brand-tint)]/70",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => setCalendarId(cal.id)}
                />
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: palette.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{cal.summary}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Link
        href={calendarAvailabilityHref()}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--brand-tint)]/50",
          route.view === "availability" && calendarUi.activeNav,
        )}
      >
        <Clock className="size-4 shrink-0" />
        Find time
      </Link>

      {route.view !== "week" && (
        <Link href={calendarWeekHref()} className={cn("text-sm hover:underline", calendarUi.link)}>
          ← Back to week view
        </Link>
      )}
    </aside>
  );
}
