import { getTenantForUser } from "@/server/integrations/tenant";

export async function syncGmailInbox(
  userId: string,
): Promise<{ synced: number }> {
  const tenant = getTenantForUser(userId);
  const result = await tenant.gmail.api.threads.list({ maxResults: 100 });
  return { synced: result.threads?.length ?? 0 };
}
