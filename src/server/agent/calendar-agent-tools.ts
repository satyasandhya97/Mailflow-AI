import { tool, type ToolSet } from "ai";
import { z } from "zod";

import { getTenantForUser } from "@/server/integrations/tenant";
import { syncGoogleCalendarEvents } from "@/server/services/calendar-sync.service";
import {
  DEFAULT_TIMEZONE,
  resolveCalendarWindow,
} from "@/server/agent/agent-datetime";
import { safeToolExecute } from "@/server/agent/tool-error";

const DEFAULT_TIMEZONE_LOCAL = DEFAULT_TIMEZONE;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeAttendees(attendees: string[] | undefined): string[] {
  if (!attendees?.length) return [];

  const invalid = attendees.filter((email) => !EMAIL_PATTERN.test(email));
  if (invalid.length > 0) {
    throw new Error(`Invalid attendee email(s): ${invalid.join(", ")}`);
  }

  return attendees;
}

type CalendarAgentToolsOptions = {
  userId: string;
  onCalendarSynced?: () => void;
};

async function syncAfterMutation(userId: string, onSynced?: () => void) {
  try {
    await syncGoogleCalendarEvents(userId);
    onSynced?.();
  } catch (error) {
    console.warn("[agent/calendar] sync failed", error);
  }
}

export function buildCalendarAgentTools(
  options: CalendarAgentToolsOptions,
): ToolSet {
  const { userId, onCalendarSynced } = options;
  const tenant = getTenantForUser(userId);

  return {
    create_calendar_event: tool({
      description:
        "Create a Google Calendar event on the user's primary calendar. Only call after the user confirmed title and time, or explicitly asked you to fill details yourself.",
      inputSchema: z.object({
        title: z.string().min(1).describe("Event title / summary"),
        description: z.string().optional(),
        location: z.string().optional(),
        allDay: z
          .boolean()
          .optional()
          .describe("True for all-day events (use startDate/endDate)"),
        startDateTime: z
          .string()
          .optional()
          .describe("RFC3339 start for timed events, e.g. 2026-06-15T09:00:00"),
        endDateTime: z
          .string()
          .optional()
          .describe("RFC3339 end for timed events"),
        startDate: z
          .string()
          .optional()
          .describe("YYYY-MM-DD for all-day start"),
        endDate: z
          .string()
          .optional()
          .describe("YYYY-MM-DD for all-day end (exclusive)"),
        timeZone: z
          .string()
          .optional()
          .describe("IANA timezone, default Asia/Kolkata"),
        attendees: z
          .array(z.string())
          .optional()
          .describe("Guest email addresses"),
        sendUpdates: z.enum(["all", "none", "externalOnly"]).optional(),
        calendarId: z.string().optional(),
      }),
      execute: safeToolExecute(async (input) => {
        const calendarId = input.calendarId ?? "primary";
        const allDay = input.allDay ?? false;

        if (allDay) {
          if (!input.startDate || !input.endDate) {
            throw new Error(
              "All-day events require startDate and endDate (YYYY-MM-DD).",
            );
          }
        } else if (!input.startDateTime || !input.endDateTime) {
          throw new Error(
            "Timed events require startDateTime and endDateTime (RFC3339).",
          );
        }

        const start = allDay
          ? { date: input.startDate! }
          : {
              dateTime: input.startDateTime!,
              timeZone: input.timeZone ?? DEFAULT_TIMEZONE_LOCAL,
            };

        const end = allDay
          ? { date: input.endDate! }
          : {
              dateTime: input.endDateTime!,
              timeZone: input.timeZone ?? DEFAULT_TIMEZONE_LOCAL,
            };

        const attendees = normalizeAttendees(input.attendees);

        const event = await tenant.googlecalendar.api.events.create({
          calendarId,
          sendUpdates:
            input.sendUpdates ?? (attendees.length ? "all" : "none"),
          event: {
            summary: input.title,
            description: input.description,
            location: input.location,
            start,
            end,
            attendees: attendees.map((email) => ({ email })),
          },
        });

        await syncAfterMutation(userId, onCalendarSynced);

        return JSON.stringify({
          id: event.id,
          title: event.summary ?? input.title,
          htmlLink: event.htmlLink,
          start: event.start,
          end: event.end,
        });
      }),
    }),

    list_calendar_events: tool({
      description:
        "List calendar events. Prefer period=upcoming when the user says 'list all events'. Use period=today for today's schedule.",
      inputSchema: z.object({
        period: z
          .enum(["today", "week", "month", "upcoming"])
          .optional()
          .describe(
            "Shortcut range — use upcoming for 'list all events', today for today's events",
          ),
        timeMin: z
          .string()
          .optional()
          .describe("ISO/RFC3339 range start with timezone, e.g. 2026-06-15T00:00:00Z"),
        timeMax: z
          .string()
          .optional()
          .describe("ISO/RFC3339 range end with timezone"),
        calendarId: z.string().optional(),
        maxResults: z.number().min(1).max(250).optional(),
      }),
      execute: safeToolExecute(async (input) => {
        const { timeMin, timeMax } = resolveCalendarWindow({
          period: input.period,
          timeMin: input.timeMin,
          timeMax: input.timeMax,
        });

        const result = await tenant.googlecalendar.api.events.getMany({
          calendarId: input.calendarId ?? "primary",
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: input.maxResults ?? 50,
        });

        const items = (result.items ?? []).map((e) => ({
          id: e.id,
          title: e.summary,
          start: e.start,
          end: e.end,
          htmlLink: e.htmlLink,
        }));

        return JSON.stringify({ count: items.length, events: items });
      }),
    }),

    delete_calendar_events: tool({
      description:
        "Delete multiple calendar events by ID, or all events in a date range. DESTRUCTIVE — only after user confirms.",
      inputSchema: z.object({
        eventIds: z.array(z.string()).optional(),
        timeMin: z
          .string()
          .optional()
          .describe("Delete all events from this date (with timeMax)"),
        timeMax: z.string().optional(),
        calendarId: z.string().optional(),
      }),
      execute: safeToolExecute(async (input) => {
        const calendarId = input.calendarId ?? "primary";
        let ids = input.eventIds ?? [];

        if (ids.length === 0 && input.timeMin && input.timeMax) {
          const range = resolveCalendarWindow({
            timeMin: input.timeMin,
            timeMax: input.timeMax,
          });

          let pageToken: string | undefined;
          ids = [];

          do {
            const res = await tenant.googlecalendar.api.events.getMany({
              calendarId,
              timeMin: range.timeMin,
              timeMax: range.timeMax,
              singleEvents: true,
              maxResults: 250,
              pageToken,
            });

            for (const item of res.items ?? []) {
              if (item.id) ids.push(item.id);
            }

            pageToken = res.nextPageToken;
          } while (pageToken);
        }

        let deleted = 0;
        for (const id of ids) {
          await tenant.googlecalendar.api.events.delete({
            calendarId,
            id,
            sendUpdates: "none",
          });
          deleted++;
        }

        await syncAfterMutation(userId, onCalendarSynced);

        return JSON.stringify({ deleted });
      }),
    }),
  };
}
