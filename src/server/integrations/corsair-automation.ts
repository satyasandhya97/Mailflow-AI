import { env } from "@/env";
import { getTenantForUser } from "@/server/integrations/tenant";
import { runEventTriggeredTasks } from "@/server/services/task-event-trigger.service";
import { syncGoogleCalendarEvents } from "@/server/services/calendar-sync.service";
import { broadcastCalendarEventsUpdated } from "@/server/ws/calendar-realtime-broadcast";
import { syncGmailInbox } from "@/server/services/gmail-sync.service";
import {
  createScheduledEmail,
  hasPendingScheduledEmail,
} from "@/server/services/scheduled-email.service";
import { broadcastGmailInboxUpdated } from "@/server/ws/gmail-realtime-broadcast";

const MEETING_KEYWORDS = [
  "meeting",
  "call",
  "schedule",
  "invite",
  "calendar",
  "sync",
  "standup",
  "appointment",
];

const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function extractTenantIdFromHookContext(ctx: unknown): string | undefined {
  if (typeof ctx !== "object" || ctx === null) return undefined;
  if ("tenantId" in ctx && typeof ctx.tenantId === "string") {
    return ctx.tenantId;
  }
  return undefined;
}

function includesMeetingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return MEETING_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function parseEventStartFromText(text: string): Date | null {
  const isoMatch = /\b(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)\b/.exec(text);
  if (isoMatch?.[1]) {
    const parsed = new Date(isoMatch[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const dateTimeMatch = /\b(20\d{2}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})\b/.exec(text);
  if (dateTimeMatch?.[1] && dateTimeMatch[2]) {
    const parsed = new Date(`${dateTimeMatch[1]}T${dateTimeMatch[2]}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export async function handleGmailMessageChangedWebhook(
  tenantId: string,
  response: unknown,
): Promise<void> {
  await syncGmailInbox(tenantId).catch((error) => {
    console.warn("[automation/gmail] sync failed:", error);
  });

  await broadcastGmailInboxUpdated(tenantId).catch((error) => {
    console.warn("[automation/gmail] broadcast failed:", error);
  });

  await runEmailSchedulingAutomations(tenantId, response).catch((error) => {
    console.warn("[automation/gmail] scheduling automations failed:", error);
  });

  await runGmailEventTriggeredTasks(tenantId, response).catch((error) => {
    console.warn("[automation/gmail] event-triggered tasks failed:", error);
  });
}

/** Fire user-defined Gmail event tasks when a new message arrives. */
export async function runGmailEventTriggeredTasks(
  tenantId: string,
  response: unknown,
): Promise<void> {
  const record = (response ?? {}) as { type?: string };
  if (record.type && record.type !== "messageReceived") return;

  const tenant = getTenantForUser(tenantId);
  const messages = await tenant.gmail.db.messages.list({ limit: 5 });

  const latest = messages
    .map((message) => ({
      message,
      date: Date.parse(String(message.data?.internalDate ?? "")),
    }))
    .sort((a, b) => b.date - a.date)[0]?.message;

  const data = (latest?.data ?? {}) as Record<string, unknown>;
  const from = typeof data.from === 'string' ? data.from : (typeof data.sender === 'string' ? data.sender : "");
  const subject = typeof data.subject === 'string' ? data.subject : "";

  await runEventTriggeredTasks(tenantId, "gmail", { from, subject });
}

export async function handleCalendarEventChangedWebhook(
  tenantId: string,
  _response: unknown,
): Promise<void> {
  await syncGoogleCalendarEvents(tenantId).catch((error) => {
    console.warn("[automation/calendar] sync failed:", error);
  });

  await broadcastCalendarEventsUpdated(tenantId).catch((error) => {
    console.warn("[automation/calendar] broadcast failed:", error);
  });

  await runCalendarReminderAutomations(tenantId).catch((error) => {
    console.warn("[automation/calendar] reminder automations failed:", error);
  });

  await runEventTriggeredTasks(tenantId, "calendar", {}).catch((error) => {
    console.warn("[automation/calendar] event-triggered tasks failed:", error);
  });
}

export async function runEmailSchedulingAutomations(
  tenantId: string,
  response: unknown,
): Promise<void> {
  if (!response || typeof response !== "object") return;

  const record = response as { type?: string };
  if (record.type !== "messageReceived") return;

  const tenant = getTenantForUser(tenantId);
  const messages = await tenant.gmail.db.messages.list({ limit: 10 });

  const latest = messages
    .map((message) => ({
      message,
      date: Date.parse(String(message.data?.internalDate ?? "")),
    }))
    .sort((a, b) => b.date - a.date)[0]?.message;

  if (!latest?.data) return;

  const data = latest.data as Record<string, unknown>;
  const subject = typeof data.subject === 'string' ? data.subject : (typeof latest.entity_id === 'string' ? latest.entity_id : "Meeting");
  const snippet = typeof data.snippet === 'string' ? data.snippet : "";
  const body = typeof data.body === 'string' ? data.body : snippet;
  const combined = `${subject}\n${body}\n${snippet}`;

  if (!includesMeetingIntent(combined)) return;

  const start = parseEventStartFromText(combined) ?? getDefaultMeetingStart();
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const calendarConnected = await tenant.googlecalendar.keys
    .get_refresh_token()
    .then(Boolean)
    .catch(() => false);

  if (!calendarConnected) return;

  await tenant.googlecalendar.api.events.create({
    calendarId: "primary",
    event: {
      summary: subject.slice(0, 120) || "Meeting from email",
      description: `Auto-created from Gmail message.\n\n${snippet}`.slice(
        0,
        4000,
      ),
      start: {
        dateTime: start.toISOString(),
        timeZone: DEFAULT_TIMEZONE,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: DEFAULT_TIMEZONE,
      },
    },
  });

  console.info("[automation/gmail] created calendar event from email", {
    tenantId,
    subject,
    start: start.toISOString(),
  });
}

export async function runCalendarReminderAutomations(
  tenantId: string,
): Promise<void> {
  const tenant = getTenantForUser(tenantId);
  const gmailConnected = await tenant.gmail.keys
    .get_refresh_token()
    .then(Boolean)
    .catch(() => false);

  if (!gmailConnected) return;

  const now = new Date();
  const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await tenant.googlecalendar.db.events.list({
    limit: 20,
    offset: 0,
  });

  for (const event of events) {
    const data = event.data as Record<string, unknown> | undefined;
    if (!data) continue;

    const summary = typeof data.summary === 'string' ? data.summary : "Calendar event";
    const startRaw =
      (data.start as { dateTime?: string; date?: string } | undefined)
        ?.dateTime ??
      (data.start as { date?: string } | undefined)?.date;

    if (!startRaw) continue;

    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) continue;
    if (start <= now || start > dayAhead) continue;

    const reminderAt = new Date(start.getTime() - 30 * 60 * 1000);
    if (reminderAt <= now) continue;

    const attendees = (data.attendees as Array<{ email?: string }> | undefined)
      ?.map((a) => a.email?.trim())
      .filter((email): email is string => Boolean(email));

    const recipient = attendees?.[0];
    if (!recipient) continue;

    const subject = `Reminder: ${summary}`;
    const body = `Hi,\n\nThis is a reminder that "${summary}" starts at ${start.toLocaleString("en-IN", { timeZone: DEFAULT_TIMEZONE })}.\n\n— Mailflow AI`;

    const duplicate = await hasPendingScheduledEmail({
      userId: tenantId,
      to: recipient,
      subject,
      sendAt: reminderAt,
    });
    if (duplicate) continue;

    await createScheduledEmail({
      userId: tenantId,
      to: recipient,
      subject,
      body,
      sendAt: reminderAt,
      source: "automation",
    });

    console.info("[automation/calendar] scheduled reminder email", {
      tenantId,
      recipient,
      sendAt: reminderAt.toISOString(),
      summary,
    });
  }
}

function getDefaultMeetingStart(): Date {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  return start;
}

export function validateGmailSendArgs(args: { raw?: string }): void {
  if (!args.raw?.trim()) {
    throw new Error("Cannot send an empty email message.");
  }

  if (args.raw.length > 35_000_000) {
    throw new Error("Email message is too large to send.");
  }
}

export function applyCalendarEventDefaults<T extends { event?: Record<string, unknown> }>(
  args: T,
): T {
  const event = args.event ?? {};
  const start = event.start as Record<string, unknown> | undefined;
  const end = event.end as Record<string, unknown> | undefined;

  return {
    ...args,
    event: {
      ...event,
      start: start
        ? {
          ...start,
          timeZone: start.timeZone ?? DEFAULT_TIMEZONE,
        }
        : start,
      end: end
        ? {
          ...end,
          timeZone: end.timeZone ?? DEFAULT_TIMEZONE,
        }
        : end,
    },
  };
}

export function verifyCronSecret(request: Request): boolean {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn("[cron] CRON_SECRET is not configured");
    return false;
  }

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
