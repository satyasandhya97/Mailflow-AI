"use client";

import { CalendarCheck, CalendarClock, MapPin } from "lucide-react";

import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardAgendaSkeleton } from "@/features/dashboard/components/skeletons";
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";
import { selectTodaysEvents } from "@/features/dashboard/lib/dashboard-data";

export function DashboardAgenda() {
  const { events, calendarConnected } = useDashboardData();
  const todaysEvents = selectTodaysEvents(events.data ?? []);

  const emptyTitle = calendarConnected ? "You're all clear" : "Calendar not connected";
  const emptyMessage = calendarConnected
    ? "No events today — enjoy the focus time."
    : "Connect Google Calendar to see your schedule here.";

  return (
    <DashboardSection
      title="Today's schedule"
      icon={CalendarClock}
      action={{ label: "Open calendar", href: "/calendar" }}
      isLoading={calendarConnected && events.isLoading}
      skeleton={<DashboardAgendaSkeleton />}
      isEmpty={todaysEvents.length === 0}
      emptyIcon={CalendarCheck}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
    >
      <ul className="-mx-2">
        {todaysEvents.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
          >
            <span className="flex w-16 shrink-0 flex-col items-center rounded-md bg-muted px-2 py-1.5 text-center">
              <span className="text-xs font-medium tabular-nums leading-tight">
                {event.time}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{event.title}</p>
              {event.location ? (
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" />
                  {event.location}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
