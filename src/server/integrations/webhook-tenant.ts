import { eq } from "drizzle-orm";

import { db } from "@/server/db";import { users } from "@/server/db/schema";

function normalizeHeaderKey(key: string): string {
  return key.toLowerCase();
}

function getHeader(
  headers: Record<string, string> | undefined,
  name: string,
): string | null {
  if (!headers) return null;

  const target = normalizeHeaderKey(name);
  for (const [key, value] of Object.entries(headers)) {
    if (normalizeHeaderKey(key) === target && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function extractGmailPushEmail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const record = body as { message?: { data?: string } };
  const data = record.message?.data;
  if (!data) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    ) as { emailAddress?: string };
    const trimmed = decoded.emailAddress?.trim();
    if (!trimmed) return null;
    return trimmed;
  } catch {
    return null;
  }
}

function decodePubSubData(data: string): Record<string, unknown> | null {
  try {
    return JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractCalendarChannelToken(
  body: unknown,
  headers?: Record<string, string>,
): string | null {
  const headerToken =
    getHeader(headers, "X-Goog-Channel-Token") ??
    getHeader(headers, "x-goog-channel-token");
  if (headerToken) return headerToken;

  if (!body || typeof body !== "object") return null;

  const record = body as { message?: { data?: string } };
  const data = record.message?.data;
  if (!data) return null;

  const decoded = decodePubSubData(data);
  const token = decoded?.channelToken;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

function extractOrganizerEmail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const record = body as {
    event?: {
      organizer?: { email?: string };
      creator?: { email?: string };
    };
  };

  const email =
    record.event?.organizer?.email?.trim() ??
    record.event?.creator?.email?.trim();
  return email ?? null;
}

async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    columns: { id: true },
  });
  return user?.id ?? null;
}

export async function resolveWebhookTenantId(
  body: unknown,
  headers?: Record<string, string>,
): Promise<string | null> {
  const channelToken = extractCalendarChannelToken(body, headers);
  if (channelToken) {
    const byTokenUser = await db.query.users.findFirst({
      where: eq(users.id, channelToken),
      columns: { id: true },
    });
    if (byTokenUser?.id) {
      return byTokenUser.id;
    }
  }

  const gmailEmail = extractGmailPushEmail(body);
  if (gmailEmail) {
    const userId = await resolveUserIdByEmail(gmailEmail);
    if (userId) return userId;
  }

  const organizerEmail = extractOrganizerEmail(body);
  if (organizerEmail) {
    const userId = await resolveUserIdByEmail(organizerEmail);
    if (userId) return userId;
  }

  return null;
}
