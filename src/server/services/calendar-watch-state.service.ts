import { and, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { corsairAccounts, corsairIntegrations } from "@/server/db/schema";

export type CalendarWatchState = {
  channelId: string;
  resourceId: string;
  expiration: string;
  registeredAt: string;
};

function isCalendarIntegration(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase();
  return (
    normalized === "googlecalendar" ||
    normalized.includes("googlecalendar") ||
    normalized.includes("google_calendar")
  );
}

async function findCalendarAccountId(userId: string): Promise<string | null> {
  const rows = await db
    .select({
      accountId: corsairAccounts.id,
      integrationName: corsairIntegrations.name,
    })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id),
    )
    .where(eq(corsairAccounts.tenantId, userId));

  const match = rows.find((row) => isCalendarIntegration(row.integrationName));
  return match?.accountId ?? null;
}

export async function readCalendarWatchState(
  userId: string,
): Promise<CalendarWatchState | null> {
  const accountId = await findCalendarAccountId(userId);
  if (!accountId) return null;

  const account = await db.query.corsairAccounts.findFirst({
    where: eq(corsairAccounts.id, accountId),
    columns: { config: true },
  });

  if (!account?.config || typeof account.config !== "object") return null;

  const watch = (account.config as Record<string, unknown>).calendarWatch;
  if (!watch || typeof watch !== "object") return null;

  const record = watch as Record<string, unknown>;
  if (typeof record.expiration !== "string") return null;

  return {
    channelId: typeof record.channelId === "string" ? record.channelId : "",
    resourceId: typeof record.resourceId === "string" ? record.resourceId : "",
    expiration: record.expiration,
    registeredAt:
      typeof record.registeredAt === "string" ? record.registeredAt : "",
  };
}

export async function writeCalendarWatchState(
  userId: string,
  state: CalendarWatchState,
): Promise<void> {
  const accountId = await findCalendarAccountId(userId);
  if (!accountId) return;

  const account = await db.query.corsairAccounts.findFirst({
    where: eq(corsairAccounts.id, accountId),
    columns: { config: true },
  });

  const existingConfig =
    account?.config && typeof account.config === "object"
      ? (account.config as Record<string, unknown>)
      : {};

  await db
    .update(corsairAccounts)
    .set({
      config: { ...existingConfig, calendarWatch: state },
      updatedAt: new Date(),
    })
    .where(and(eq(corsairAccounts.id, accountId)));
}

export async function listUsersWithCalendarWatchState(): Promise<
  Array<{ userId: string; state: CalendarWatchState }>
> {
  const rows = await db
    .select({
      userId: corsairAccounts.tenantId,
      config: corsairAccounts.config,
      integrationName: corsairIntegrations.name,
    })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id),
    );

  const results: Array<{ userId: string; state: CalendarWatchState }> = [];

  for (const row of rows) {
    if (!isCalendarIntegration(row.integrationName)) continue;
    if (!row.config || typeof row.config !== "object") continue;

    const watch = (row.config as Record<string, unknown>).calendarWatch;
    if (!watch || typeof watch !== "object") continue;

    const record = watch as Record<string, unknown>;
    if (typeof record.expiration !== "string") continue;

    results.push({
      userId: row.userId,
      state: {
        channelId: typeof record.channelId === "string" ? record.channelId : "",
        resourceId:
          typeof record.resourceId === "string" ? record.resourceId : "",
        expiration: record.expiration,
        registeredAt:
          typeof record.registeredAt === "string" ? record.registeredAt : "",
      },
    });
  }

  return results;
}
