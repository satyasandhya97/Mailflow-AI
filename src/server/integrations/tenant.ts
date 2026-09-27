import { env } from "@/env";
import { corsair } from "@/server/integrations/corsair";

export function getTenantForUser(userId: string) {
  return corsair.withTenant(userId);
}

/** @deprecated Prefer getTenantForUser with the logged-in user's id. */
export function getTenant() {
  return corsair.withTenant(env.TENANT_ID);
}
