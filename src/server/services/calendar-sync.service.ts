import { getTenantForUser } from "@/server/integrations/tenant";

type SyncGoogleCalendarOptions = {
  calendarId?: string;
  /** Weeks before today to include. Default 1. */
  weeksBefore?: number;
  /** Weeks after today to include. Default 8. */
  weeksAfter?: number;
};

export async function syncGoogleCalendarEvents(
  userId: string,
  options: SyncGoogleCalendarOptions = {},
): Promise<{ synced: number }> {
  const tenant = getTenantForUser(userId);
  const weeksBefore = options.weeksBefore ?? 1;
  const weeksAfter = options.weeksAfter ?? 8;

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - weeksBefore * 7);

  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + weeksAfter * 7);

  const result = await tenant.googlecalendar.api.events.getMany({
    calendarId: options.calendarId ?? "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
  });

  return { synced: result.items?.length ?? 0 };
}
