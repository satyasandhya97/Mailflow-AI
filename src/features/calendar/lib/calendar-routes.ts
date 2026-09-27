export const CALENDAR_PATH = "/calendar";
export const CALENDAR_DEFAULT = `${CALENDAR_PATH}` as const;

export type CalendarPathState = {
  view: "week" | "event" | "availability";
  eventId: string | null;
};

export function parseCalendarPathname(pathname: string): CalendarPathState {
  const segments = pathname
    .replace(new RegExp(`^${CALENDAR_PATH}/?`), "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) {
    return { view: "week", eventId: null };
  }

  const [head, second] = segments;

  if (head === "event") {
    return { view: "event", eventId: second ?? null };
  }

  if (head === "availability") {
    return { view: "availability", eventId: null };
  }

  return { view: "week", eventId: null };
}

export function calendarWeekHref(): string {
  return CALENDAR_DEFAULT;
}

export function calendarEventHref(eventId: string): string {
  return `${CALENDAR_PATH}/event/${eventId}`;
}

export function calendarAvailabilityHref(): string {
  return `${CALENDAR_PATH}/availability`;
}
