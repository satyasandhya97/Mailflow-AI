import type { MappedCalendarEvent } from "@/features/calendar/types";

export type AgendaEvent = {
  id: string;
  title: string;
  location: string;
  time: string;
  start: number;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatEventTime(start: string): string {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return "All day";
  // Date-only values (no time component) represent all-day events.
  if (!start.includes("T")) return "All day";
  return startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function selectTodaysEvents(
  events: MappedCalendarEvent[],
  now = new Date(),
): AgendaEvent[] {
  return events
    .filter((event) => {
      const start = new Date(event.start);
      return !Number.isNaN(start.getTime()) && isSameDay(start, now);
    })
    .map((event) => {
      const start = new Date(event.start);
      return {
        id: event.id,
        title: event.summary || "(no title)",
        location: event.location ?? "",
        time: formatEventTime(event.start),
        start: start.getTime(),
      };
    })
    .sort((a, b) => a.start - b.start);
}
