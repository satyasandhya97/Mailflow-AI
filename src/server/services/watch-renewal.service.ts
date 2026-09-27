import { isPluginConnected } from "@/server/services/integrations.service";
import {
  listUsersWithCalendarWatchState,
  readCalendarWatchState,
} from "@/server/services/calendar-watch-state.service";
import {
  listUsersWithGmailWatchState,
  readGmailWatchState,
} from "@/server/services/gmail-watch-state.service";
import { registerCalendarWatchForUser } from "@/server/services/calendar-watch.service";
import { registerGmailWatchForUser } from "@/server/services/gmail-watch.service";

const GMAIL_RENEW_BEFORE_MS = 24 * 60 * 60 * 1000;
const CALENDAR_RENEW_BEFORE_MS = 12 * 60 * 60 * 1000;

function isExpiringSoon(expirationIso: string, thresholdMs: number): boolean {
  const expiration = Date.parse(expirationIso);
  if (Number.isNaN(expiration)) return true;
  return expiration - Date.now() <= thresholdMs;
}

export async function renewExpiringGmailWatches(): Promise<number> {
  const entries = await listUsersWithGmailWatchState();
  let renewed = 0;

  for (const entry of entries) {
    if (!isExpiringSoon(entry.state.expiration, GMAIL_RENEW_BEFORE_MS)) {
      continue;
    }

    const connected = await isPluginConnected(entry.userId, "gmail");
    if (!connected) continue;

    const result = await registerGmailWatchForUser(entry.userId);
    if (result) renewed += 1;
  }

  return renewed;
}

export async function renewExpiringCalendarWatches(): Promise<number> {
  const entries = await listUsersWithCalendarWatchState();
  let renewed = 0;

  for (const entry of entries) {
    if (!isExpiringSoon(entry.state.expiration, CALENDAR_RENEW_BEFORE_MS)) {
      continue;
    }

    const connected = await isPluginConnected(entry.userId, "googlecalendar");
    if (!connected) continue;

    const result = await registerCalendarWatchForUser(entry.userId);
    if (result) renewed += 1;
  }

  return renewed;
}

export async function ensureInitialWatchesForConnectedUsers(): Promise<{
  gmailRegistered: number;
  calendarRegistered: number;
}> {
  let gmailRegistered = 0;
  let calendarRegistered = 0;

  const gmailEntries = await listUsersWithGmailWatchState();
  const calendarEntries = await listUsersWithCalendarWatchState();
  const gmailUsers = new Set(gmailEntries.map((entry) => entry.userId));
  const calendarUsers = new Set(calendarEntries.map((entry) => entry.userId));

  for (const userId of gmailUsers) {
    const state = await readGmailWatchState(userId);
    if (state) continue;
    const connected = await isPluginConnected(userId, "gmail");
    if (!connected) continue;
    const result = await registerGmailWatchForUser(userId);
    if (result) gmailRegistered += 1;
  }

  for (const userId of calendarUsers) {
    const state = await readCalendarWatchState(userId);
    if (state) continue;
    const connected = await isPluginConnected(userId, "googlecalendar");
    if (!connected) continue;
    const result = await registerCalendarWatchForUser(userId);
    if (result) calendarRegistered += 1;
  }

  return { gmailRegistered, calendarRegistered };
}

export async function renewAllWatches(): Promise<{
  gmailRenewed: number;
  calendarRenewed: number;
}> {
  const [gmailRenewed, calendarRenewed] = await Promise.all([
    renewExpiringGmailWatches(),
    renewExpiringCalendarWatches(),
  ]);

  return { gmailRenewed, calendarRenewed };
}
