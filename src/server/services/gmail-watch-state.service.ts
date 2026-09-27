import { and, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { corsairAccounts, corsairIntegrations } from "@/server/db/schema";

export type GmailWatchState = {
  expiration: string;
  historyId: string;
  registeredAt: string;
};

function isGmailIntegration(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase();
  return normalized === "gmail" || normalized.includes("gmail");
}

async function findGmailAccountId(userId: string): Promise<string | null> {
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

  const match = rows.find((row) => isGmailIntegration(row.integrationName));
  return match?.accountId ?? null;
}

export async function readGmailWatchState(
  userId: string,
): Promise<GmailWatchState | null> {
  const accountId = await findGmailAccountId(userId);
  if (!accountId) return null;

  const account = await db.query.corsairAccounts.findFirst({
    where: eq(corsairAccounts.id, accountId),
    columns: { config: true },
  });

  if (!account?.config || typeof account.config !== "object") return null;

  const watch = (account.config as Record<string, unknown>).gmailWatch;
  if (!watch || typeof watch !== "object") return null;

  const record = watch as Record<string, unknown>;
  if (typeof record.expiration !== "string") return null;

  return {
    expiration: record.expiration,
    historyId: typeof record.historyId === "string" ? record.historyId : "",
    registeredAt:
      typeof record.registeredAt === "string" ? record.registeredAt : "",
  };
}

export async function writeGmailWatchState(
  userId: string,
  state: GmailWatchState,
): Promise<void> {
  const accountId = await findGmailAccountId(userId);
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
      config: { ...existingConfig, gmailWatch: state },
      updatedAt: new Date(),
    })
    .where(and(eq(corsairAccounts.id, accountId)));
}

export async function listUsersWithGmailWatchState(): Promise<
  Array<{ userId: string; state: GmailWatchState }>
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

  const results: Array<{ userId: string; state: GmailWatchState }> = [];

  for (const row of rows) {
    if (!isGmailIntegration(row.integrationName)) continue;
    if (!row.config || typeof row.config !== "object") continue;

    const watch = (row.config as Record<string, unknown>).gmailWatch;
    if (!watch || typeof watch !== "object") continue;

    const record = watch as Record<string, unknown>;
    if (typeof record.expiration !== "string") continue;

    results.push({
      userId: String(row.userId),
      state: {
        expiration: record.expiration,
        historyId: typeof record.historyId === "string" ? record.historyId : "",
        registeredAt:
          typeof record.registeredAt === "string" ? record.registeredAt : "",
      },
    });
  }

  return results;
}
