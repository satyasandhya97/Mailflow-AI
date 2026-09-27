import { refreshGoogleAccessTokenForUser } from "@/server/integrations/google-oauth.utils";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

/**
 * Direct Gmail REST fallbacks for operations where the Corsair client currently
 * throws (e.g. `messages.send` / `labels.list` raising "e.split is not a
 * function"). These reuse the stored refresh token via a freshly minted access
 * token, so behaviour matches the connected account.
 */

async function getAccessTokenOrThrow(userId: string): Promise<string> {
  const accessToken = await refreshGoogleAccessTokenForUser(userId, "gmail");
  if (!accessToken) {
    throw new Error(
      "Gmail is not connected. Please connect it on the Plugins page.",
    );
  }
  return accessToken;
}

export async function sendGmailMessageRest(
  userId: string,
  raw: string,
): Promise<{ id: string; threadId: string }> {
  const accessToken = await getAccessTokenOrThrow(userId);

  const res = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { id?: string; threadId?: string };
  return { id: data.id ?? "", threadId: data.threadId ?? "" };
}

export type GmailRestLabel = {
  id: string;
  name: string;
  type?: "system" | "user";
};

export async function listGmailLabelsRest(
  userId: string,
): Promise<GmailRestLabel[]> {
  const accessToken = await getAccessTokenOrThrow(userId);

  const res = await fetch(`${GMAIL_API_BASE}/users/me/labels`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Gmail labels failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { labels?: GmailRestLabel[] };
  return data.labels ?? [];
}
