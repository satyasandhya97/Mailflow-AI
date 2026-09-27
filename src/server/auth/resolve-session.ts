import { getSessionUser } from "@/server/services/session.service";

export async function resolveSessionFromToken(token: string | null) {
  if (!token) return null;

  const user = await getSessionUser(token);
  if (!user) return null;

  return { user, token };
}
