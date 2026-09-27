import { env } from "@/env";
import {
  isPublicAppUrl,
  refreshGoogleAccessTokenForUser,
} from "@/server/integrations/google-oauth.utils";
import { writeGmailWatchState } from "@/server/services/gmail-watch-state.service";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export function isGmailWebhookConfigured(): boolean {
  return Boolean(env.GMAIL_PUBSUB_TOPIC?.trim());
}

/**
 * Registers Gmail push notifications via users.watch → Google Cloud Pub/Sub.
 * Pub/Sub must push to `{APP_URL}/api/webhooks` (one subscription for the app).
 * Uses labelIds INBOX; renew before expiration (~7 days).
 */
export async function registerGmailWatchForUser(
  userId: string,
): Promise<{ historyId: string; expiration: string } | null> {
  const topicName = env.GMAIL_PUBSUB_TOPIC?.trim();
  if (!topicName) {
    console.info(
      "[gmail/watch] Skipping — GMAIL_PUBSUB_TOPIC is not set. See README for Pub/Sub setup.",
    );
    return null;
  }

  if (!isPublicAppUrl(env.APP_URL)) {
    console.info(
      "[gmail/watch] APP_URL is not public — watch will register but Pub/Sub cannot deliver until you use a public URL (ngrok or production).",
    );
  }

  const accessToken = await refreshGoogleAccessTokenForUser(userId, "gmail");
  if (!accessToken) {
    console.warn("[gmail/watch] Missing OAuth credentials for user", userId);
    return null;
  }

  const watchRes = await fetch(`${GMAIL_API_BASE}/users/me/watch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName,
      labelIds: ["INBOX"],
    }),
  });

  if (!watchRes.ok) {
    console.warn("[gmail/watch] Watch registration failed:", await watchRes.text());
    return null;
  }

  const data = (await watchRes.json()) as {
    historyId?: string;
    expiration?: string;
  };

  const expiration = data.expiration
    ? new Date(Number(data.expiration)).toISOString()
    : "unknown";

  await writeGmailWatchState(userId, {
    historyId: data.historyId ?? "",
    expiration,
    registeredAt: new Date().toISOString(),
  });

  console.info("[gmail/watch] Watch registered", {
    userId,
    historyId: data.historyId,
    expiration,
    topicName,
  });

  return {
    historyId: data.historyId ?? "",
    expiration,
  };
}
