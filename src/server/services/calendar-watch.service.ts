import { randomUUID } from "node:crypto";

import { env } from "@/env";
import {
  isPublicAppUrl,
  refreshGoogleAccessTokenForUser,
} from "@/server/integrations/google-oauth.utils";
import {
  readCalendarWatchState,
  writeCalendarWatchState,
} from "@/server/services/calendar-watch-state.service";

/**
 * Registers a Google Calendar push watch channel so `onEventChanged` webhooks fire.
 * Uses channelToken = userId for multi-tenant routing.
 * No-op on localhost — use ngrok + public APP_URL for dev webhooks.
 */
export async function registerCalendarWatchForUser(
  userId: string,
  calendarId = "primary",
): Promise<{ channelId: string; expiration: string } | null> {
  if (!isPublicAppUrl(env.APP_URL)) {
    console.info(
      "[calendar/watch] Skipping watch registration — APP_URL is not public. Use ngrok for local webhooks.",
    );
    return null;
  }

  const accessToken = await refreshGoogleAccessTokenForUser(
    userId,
    "googlecalendar",
  );
  if (!accessToken) {
    console.warn("[calendar/watch] Missing OAuth credentials for user", userId);
    return null;
  }

  const existing = await readCalendarWatchState(userId);
  if (existing?.channelId && existing.resourceId) {
    await stopCalendarChannel(accessToken, existing.channelId, existing.resourceId);
  }

  const channelId = randomUUID();
  const webhookUrl = `${env.APP_URL.replace(/\/$/, "")}/api/webhooks`;

  const watchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        token: userId,
      }),
    },
  );

  if (!watchRes.ok) {
    console.warn("[calendar/watch] Watch registration failed:", await watchRes.text());
    return null;
  }

  const data = (await watchRes.json()) as {
    resourceId?: string;
    expiration?: string;
  };

  const expiration = data.expiration
    ? new Date(Number(data.expiration)).toISOString()
    : "unknown";

  await writeCalendarWatchState(userId, {
    channelId,
    resourceId: data.resourceId ?? "",
    expiration,
    registeredAt: new Date().toISOString(),
  });

  console.info("[calendar/watch] Channel registered", {
    userId,
    channelId,
    resourceId: data.resourceId,
    expiration,
    webhookUrl,
  });

  return { channelId, expiration };
}

async function stopCalendarChannel(
  accessToken: string,
  channelId: string,
  resourceId: string,
): Promise<void> {
  try {
    await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        resourceId,
      }),
    });
  } catch (error) {
    console.warn("[calendar/watch] Failed to stop previous channel:", error);
  }
}
