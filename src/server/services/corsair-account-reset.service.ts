import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import {
  corsairAccounts,
  corsairEntities,
  corsairEvents,
  corsairIntegrations,
} from "@/server/db/schema";

import { corsair } from "@/server/integrations/corsair";

export type CorsairOAuthPluginId = "gmail" | "googlecalendar";

export async function resetCorsairPluginAccount(
  userId: string,
  pluginId: CorsairOAuthPluginId,
): Promise<void> {
  const integration = await db.query.corsairIntegrations.findFirst({
    where: eq(corsairIntegrations.name, pluginId),
    columns: { id: true },
  });

  if (!integration) return;

  const accounts = await db.query.corsairAccounts.findMany({
    where: and(
      eq(corsairAccounts.tenantId, userId),
      eq(corsairAccounts.integrationId, integration.id),
    ),
    columns: { id: true },
  });

  if (accounts.length === 0) return;

  const accountIds = accounts.map((account) => account.id);

  // Atomic delete: children first, then account (FK constraints).
  await db.transaction(async (tx) => {
    await tx
      .delete(corsairEntities)
      .where(inArray(corsairEntities.accountId, accountIds));

    await tx
      .delete(corsairEvents)
      .where(inArray(corsairEvents.accountId, accountIds));

    await tx
      .delete(corsairAccounts)
      .where(inArray(corsairAccounts.id, accountIds));
  });
}

export function parseOAuthStatePayload(state: string): {
  plugin?: CorsairOAuthPluginId;
  tenantId?: string;
} {
  const [payloadPart] = state.split(".");
  if (!payloadPart) return {};

  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const parsed = JSON.parse(
      Buffer.from(padded, "base64").toString("utf-8"),
    ) as { plugin?: string; tenantId?: string };

    const plugin =
      parsed.plugin === "gmail" || parsed.plugin === "googlecalendar"
        ? parsed.plugin
        : undefined;

    return {
      plugin,
      tenantId:
        typeof parsed.tenantId === "string" && parsed.tenantId.length > 0
          ? parsed.tenantId
          : undefined,
    };
  } catch {
    return {};
  }
}

export function isCorsairDecryptError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("unable to authenticate data") ||
    message.includes("failed to decrypt") ||
    message.includes("unsupported state") ||
    // Corsair throws this while decrypting a corrupt/missing DEK string
    // (e.g. the stored token predates the current CORSAIR_KEK).
    message.includes("split is not a function") ||
    // Thrown when reading a token from a freshly-created/empty account whose
    // value can't be destructured ("... is not a function or its return value
    // is not iterable"). Treat it as a recoverable empty/corrupt account.
    message.includes("is not iterable") ||
    message.includes("invalid encrypted") ||
    message.includes("invalid dek") ||
    message.includes("encrypted dek")
  );
}

export function isCorsairAccountInitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("no dek found") ||
    message.includes("initialize the account first")
  );
}

export function isCorsairAccountHealableError(error: unknown): boolean {
  return isCorsairDecryptError(error) || isCorsairAccountInitError(error);
}

function isMissingCorsairAccountError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes("account not found");
}

/**
 * True when an error genuinely means the plugin is NOT connected (no account,
 * or a corrupt/missing DEK). Everything else — DB timeouts, connection drops,
 * network blips — is transient and must NOT be treated as "disconnected".
 */
export function isExpectedDisconnectedError(error: unknown): boolean {
  return (
    isMissingCorsairAccountError(error) ||
    isCorsairAccountHealableError(error)
  );
}

/** Drop stored tokens when DEK/config cannot be decrypted (e.g. CORSAIR_KEK rotated). */
export async function healCorruptPluginAccountIfNeeded(
  userId: string,
  pluginId: CorsairOAuthPluginId,
): Promise<boolean> {
  const tenant = corsair.withTenant(userId);
  const keys =
    pluginId === "gmail" ? tenant.gmail.keys : tenant.googlecalendar.keys;

  try {
    await keys.get_refresh_token();
    return false;
  } catch (error) {
    if (isMissingCorsairAccountError(error)) {
      return false;
    }

    if (!isCorsairAccountHealableError(error)) {
      throw error;
    }

    console.warn(
      `[oauth] Removing corrupt ${pluginId} account for user ${userId}`,
      error,
    );

    await resetCorsairPluginAccount(userId, pluginId);
    return true;
  }
}

const pluginAccountLocks = new Map<string, Promise<unknown>>();

/** Serialize reset/provision for a tenant+plugin (prevents parallel FK races). */
export async function withPluginAccountLock<T>(
  userId: string,
  pluginId: CorsairOAuthPluginId,
  fn: () => Promise<T>,
): Promise<T> {
  const key = `${userId}:${pluginId}`;
  const previous = pluginAccountLocks.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(fn);

  pluginAccountLocks.set(key, run);

  try {
    return await run;
  } finally {
    if (pluginAccountLocks.get(key) === run) {
      pluginAccountLocks.delete(key);
    }
  }
}
