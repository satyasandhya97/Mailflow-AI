import { env } from "@/env";
import { resolveSessionFromToken } from "@/server/auth/resolve-session";
import { getSessionTokenFromHeader } from "@/server/auth/session-cookie";

export async function resolveMcpTenantId(
  request: Request,
): Promise<string | null> {
  const sessionToken = getSessionTokenFromHeader(
    request.headers.get("cookie"),
  );
  const session = await resolveSessionFromToken(sessionToken);
  if (session) {
    return session.user.id;
  }

  const secret = env.AGENT_MCP_INTERNAL_SECRET;
  if (!secret) return null;

  const auth = request.headers.get("authorization");
  const tenantId = request.headers.get("x-corsair-tenant-id");

  if (
    auth === `Bearer ${secret}` &&
    tenantId &&
    tenantId.trim().length > 0
  ) {
    return tenantId.trim();
  }

  return null;
}
