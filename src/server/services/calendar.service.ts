import { getTenantForUser } from "@/server/integrations/tenant";
import type {
  CalendarListItem,
  MappedCalendarEvent,
} from "@/features/calendar/types";
import { syncGoogleCalendarEvents } from "@/server/services/calendar-sync.service";
import { dedupeByEntityId } from "@/server/services/utils";

const DEFAULT_CALENDARS: CalendarListItem[] = [
  {
    id: "primary",
    summary: "Primary",
    primary: true,
    backgroundColor: "#0E635A",
  },
];

type DbEventRecord = {
  entity_id: string;
  data: {
    summary?: string;
    description?: string;
    location?: string;
    status?: string;
    start?: { date?: string; dateTime?: string; timeZone?: string };
    end?: { date?: string; dateTime?: string; timeZone?: string };
    attendees?: { email?: string; displayName?: string }[];
    htmlLink?: string;
    createdAt?: Date | null;
  };
};

type ApiEventRecord = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  attendees?: { email?: string; displayName?: string }[];
  htmlLink?: string;
};

function eventStartTimestamp(event: {
  data?: {
    start?: { date?: string; dateTime?: string };
  };
  start?: { date?: string; dateTime?: string };
}): number {
  const start =
    event.data?.start?.dateTime ??
    event.data?.start?.date ??
    event.start?.dateTime ??
    event.start?.date;
  if (!start) return 0;
  return new Date(start).getTime();
}

function mapDbEvent(event: DbEventRecord): MappedCalendarEvent {
  return {
    id: event.entity_id,
    summary: event.data.summary ?? "",
    description: event.data.description ?? "",
    location: event.data.location ?? "",
    status: event.data.status ?? "",
    start: event.data.start?.dateTime ?? event.data.start?.date ?? "",
    end: event.data.end?.dateTime ?? event.data.end?.date ?? "",
    attendees:
      event.data.attendees
        ?.map((a) => {
          if (a.displayName && a.email) return `${a.displayName} <${a.email}>`;
          return a.email ?? a.displayName ?? "";
        })
        .filter(Boolean) ?? [],
    htmlLink: event.data.htmlLink ?? "",
    createdAt: event.data.createdAt ?? null,
    timestamp: eventStartTimestamp(event),
  };
}

function mapApiEvent(event: ApiEventRecord): MappedCalendarEvent {
  const start = event.start?.dateTime ?? event.start?.date ?? "";
  const end = event.end?.dateTime ?? event.end?.date ?? "";

  return {
    id: event.id ?? "",
    summary: event.summary ?? "",
    description: event.description ?? "",
    location: event.location ?? "",
    status: event.status ?? "",
    start,
    end,
    attendees:
      event.attendees
        ?.map((a) => {
          if (a.displayName && a.email) return `${a.displayName} <${a.email}>`;
          return a.email ?? a.displayName ?? "";
        })
        .filter(Boolean) ?? [],
    htmlLink: event.htmlLink ?? "",
    createdAt: null,
    timestamp: start ? new Date(start).getTime() : 0,
  };
}

function mapCalendar(cal: {
  entity_id: string;
  data: {
    summary?: string;
    primary?: boolean;
    backgroundColor?: string;
  };
}): CalendarListItem {
  return {
    id: cal.entity_id,
    summary: cal.data.summary ?? "Untitled calendar",
    primary: Boolean(cal.data.primary),
    backgroundColor: cal.data.backgroundColor ?? "#4285f4",
  };
}

function filterEventsByWeek<
  T extends { timestamp: number; start: string },
>(events: T[], weekStart: Date, weekEnd: Date): T[] {
  const startMs = weekStart.getTime();
  const endMs = weekEnd.getTime();

  return events
    .filter((event) => {
      if (event.timestamp > 0) {
        return event.timestamp >= startMs && event.timestamp < endMs;
      }
      if (!event.start) return false;
      const ts = new Date(event.start).getTime();
      return ts >= startMs && ts < endMs;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function listCalendars(userId: string): Promise<CalendarListItem[]> {
  const tenant = getTenantForUser(userId);
  const db = tenant.googlecalendar.db as {
    calendars?: {
      list: (input: { limit: number; offset: number }) => Promise<
        {
          entity_id: string;
          data: {
            summary?: string;
            primary?: boolean;
            backgroundColor?: string;
          };
        }[]
      >;
    };
  };

  if (db.calendars?.list) {
    try {
      const calendars = await db.calendars.list({ limit: 50, offset: 0 });
      const mapped = calendars.map((cal) => mapCalendar(cal));
      if (mapped.length > 0) return mapped;
    } catch (error) {
      console.warn("[calendar] listCalendars failed:", error);
    }
  }

  return DEFAULT_CALENDARS;
}

export async function searchEvents(
  userId: string,
  input: {
    query: string;
    weekStart: string;
    weekEnd: string;
    limit: number;
    offset: number;
    calendarId?: string;
  },
): Promise<MappedCalendarEvent[]> {
  const tenant = getTenantForUser(userId);
  const weekStart = new Date(input.weekStart);
  const weekEnd = new Date(input.weekEnd);

  const events = input.query.trim()
    ? await tenant.googlecalendar.db.events.search({
        data: {
          summary: { contains: input.query },
        },
        limit: 200,
        offset: 0,
      })
    : await tenant.googlecalendar.db.events.list({
        limit: 200,
        offset: 0,
      });

  return filterEventsByWeek(
    dedupeByEntityId(events).map((event) =>
      mapDbEvent(event as DbEventRecord),
    ),
    weekStart,
    weekEnd,
  );
}

export async function getEvent(
  userId: string,
  input: { id: string; calendarId?: string },
): Promise<MappedCalendarEvent> {
  const tenant = getTenantForUser(userId);
  const calendarId = input.calendarId ?? "primary";

  const cached = await tenant.googlecalendar.db.events.findByEntityId(input.id);
  if (cached) {
    return mapDbEvent(cached);
  }

  const event = await tenant.googlecalendar.api.events.get({
    calendarId,
    id: input.id,
  });

  return mapApiEvent(event);
}

export async function refreshEvents(
  userId: string,
  input: {
    weekStart: string;
    weekEnd: string;
    calendarId?: string;
  },
) {
  const tenant = getTenantForUser(userId);
  const result = await tenant.googlecalendar.api.events.getMany({
    calendarId: input.calendarId ?? "primary",
    timeMin: input.weekStart,
    timeMax: input.weekEnd,
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });
  return {
    synced: result.items?.length ?? 0,
  };
}

export async function getAvailability(
  userId: string,
  input: {
    timeMin: string;
    timeMax: string;
    calendarIds?: string[];
  },
) {
  const tenant = getTenantForUser(userId);
  const calendarIds =
    input.calendarIds && input.calendarIds.length > 0
      ? input.calendarIds
      : ["primary"];

  const result = await tenant.googlecalendar.api.calendar.getAvailability({
    timeMin: input.timeMin,
    timeMax: input.timeMax,
    items: calendarIds.map((id) => ({ id })),
  });

  const busyBlocks: { calendarId: string; start: string; end: string }[] = [];

  if (result.calendars) {
    for (const [calendarId, calData] of Object.entries(result.calendars)) {
      for (const block of calData.busy ?? []) {
        if (block.start && block.end) {
          busyBlocks.push({
            calendarId,
            start: block.start,
            end: block.end,
          });
        }
      }
    }
  }

  busyBlocks.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  return {
    timeMin: result.timeMin ?? input.timeMin,
    timeMax: result.timeMax ?? input.timeMax,
    busyBlocks,
  };
}

export async function createDraft(
  userId: string,
  input: {
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    attendees?: string[];
    calendarId?: string;
  },
) {
  const tenant = getTenantForUser(userId);
  const event = await tenant.googlecalendar.api.events.create({
    calendarId: input.calendarId ?? "primary",
    sendUpdates: "none",
    event: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      status: "tentative",
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: input.attendees?.map((email) => ({ email })),
    },
  });

  await syncGoogleCalendarEvents(userId, {
    calendarId: input.calendarId ?? "primary",
  }).catch((error) => {
    console.warn("[calendar] post-create sync failed:", error);
  });

  return {
    id: event.id ?? "",
    htmlLink: event.htmlLink ?? "",
  };
}

export async function sendInvite(
  userId: string,
  input: {
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    attendees: string[];
    calendarId?: string;
  },
) {
  const tenant = getTenantForUser(userId);
  const event = await tenant.googlecalendar.api.events.create({
    calendarId: input.calendarId ?? "primary",
    sendUpdates: "all",
    event: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: input.attendees.map((email) => ({ email })),
    },
  });

  await syncGoogleCalendarEvents(userId, {
    calendarId: input.calendarId ?? "primary",
  }).catch((error) => {
    console.warn("[calendar] post-invite sync failed:", error);
  });

  return {
    id: event.id ?? "",
    htmlLink: event.htmlLink ?? "",
  };
}

export async function updateEvent(
  userId: string,
  input: {
    id: string;
    calendarId?: string;
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    attendees?: string[];
  },
) {
  const tenant = getTenantForUser(userId);
  const event = await tenant.googlecalendar.api.events.update({
    calendarId: input.calendarId ?? "primary",
    id: input.id,
    event: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: input.attendees?.map((email) => ({ email })),
    },
  });

  await syncGoogleCalendarEvents(userId, {
    calendarId: input.calendarId ?? "primary",
  }).catch((error) => {
    console.warn("[calendar] post-update sync failed:", error);
  });

  return {
    id: event.id ?? input.id,
    htmlLink: event.htmlLink ?? "",
  };
}

export async function deleteEvent(
  userId: string,
  input: { id: string; calendarId?: string },
) {
  const tenant = getTenantForUser(userId);
  await tenant.googlecalendar.api.events.delete({
    calendarId: input.calendarId ?? "primary",
    id: input.id,
  });

  await syncGoogleCalendarEvents(userId, {
    calendarId: input.calendarId ?? "primary",
  }).catch((error) => {
    console.warn("[calendar] post-delete sync failed:", error);
  });

  return { deleted: true as const };
}
