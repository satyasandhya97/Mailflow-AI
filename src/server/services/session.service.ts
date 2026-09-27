import { and, eq, gt } from "drizzle-orm";

import { SESSION_DURATION_DAYS } from "@/server/auth/auth.constants";
import {
  addDays,
  createId,
  createSessionToken,
  hashValue,
} from "@/server/auth/auth.crypto";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
};

export async function createUserSession(userId: string) {
  const token = createSessionToken();
  const now = new Date();

  await db.insert(sessions).values({
    id: createId(),
    userId,
    tokenHash: hashValue(token),
    expiresAt: addDays(now, SESSION_DURATION_DAYS),
  });

  return token;
}

export async function getSessionUser(token: string): Promise<SessionUser | null> {
  const tokenHash = hashValue(token);

  const [record] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) {
    return null;
  }

  return {
    id: record.userId,
    email: record.email,
    fullName: record.fullName,
  };
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashValue(token)));
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

export async function createUser(email: string, fullName: string) {
  const now = new Date();
  const [user] = await db
    .insert(users)
    .values({
      id: createId(),
      email,
      fullName,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return user!;
}
