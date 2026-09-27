import { and, eq, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

import { encodeRawEmail } from "@/lib/email-encoding";
import { db } from "@/server/db";
import { scheduledEmails } from "@/server/db/schema";
import { getTenantForUser } from "@/server/integrations/tenant";

export type ScheduledEmailSource = "agent" | "automation" | "user";

export type CreateScheduledEmailInput = {
  userId: string;
  to: string;
  subject: string;
  body: string;
  sendAt: Date;
  threadId?: string;
  source?: ScheduledEmailSource;
};

export async function createScheduledEmail(
  input: CreateScheduledEmailInput,
): Promise<{ id: string; sendAt: string }> {
  const id = nanoid();
  const sendAt = input.sendAt;

  await db.insert(scheduledEmails).values({
    id,
    userId: input.userId,
    status: "pending",
    sendAt,
    to: input.to,
    subject: input.subject,
    body: input.body,
    threadId: input.threadId,
    source: input.source ?? "user",
  });

  return { id, sendAt: sendAt.toISOString() };
}

export async function sendDueScheduledEmails(): Promise<{
  sent: number;
  failed: number;
}> {
  const now = new Date();
  const due = await db.query.scheduledEmails.findMany({
    where: and(
      eq(scheduledEmails.status, "pending"),
      lte(scheduledEmails.sendAt, now),
    ),
    limit: 50,
  });

  let sent = 0;
  let failed = 0;

  for (const row of due) {
    try {
      const tenant = getTenantForUser(row.userId);
      const raw = encodeRawEmail({
        to: row.to,
        subject: row.subject,
        body: row.body,
      });

      const message = await tenant.gmail.api.messages.send({
        raw,
        ...(row.threadId ? { threadId: row.threadId } : {}),
      });

      await db
        .update(scheduledEmails)
        .set({
          status: "sent",
          sentAt: new Date(),
          errorMessage: null,
        })
        .where(eq(scheduledEmails.id, row.id));

      console.info("[scheduled-email] sent", {
        id: row.id,
        userId: row.userId,
        messageId: message.id,
      });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .update(scheduledEmails)
        .set({
          status: "failed",
          errorMessage: message,
        })
        .where(eq(scheduledEmails.id, row.id));
      console.warn("[scheduled-email] failed", { id: row.id, message });
      failed += 1;
    }
  }

  return { sent, failed };
}

export async function hasPendingScheduledEmail(input: {
  userId: string;
  to: string;
  subject: string;
  sendAt: Date;
}): Promise<boolean> {
  const rows = await db.query.scheduledEmails.findMany({
    where: and(
      eq(scheduledEmails.userId, input.userId),
      eq(scheduledEmails.status, "pending"),
      eq(scheduledEmails.to, input.to),
      eq(scheduledEmails.subject, input.subject),
    ),
    limit: 1,
  });

  if (rows.length === 0) return false;

  const existing = rows[0]!;
  const delta = Math.abs(existing.sendAt.getTime() - input.sendAt.getTime());
  return delta < 5 * 60 * 1000;
}
