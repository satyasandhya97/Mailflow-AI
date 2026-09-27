import type { UIMessage } from "ai";
import { and, asc, desc, eq } from "drizzle-orm";

import { deriveTitle } from "@/features/agent/lib/agent-message-utils";
import type { AgentConversation } from "@/features/agent/types/agent.types";
import { db } from "@/server/db";
import { agentConversations, agentMessages } from "@/server/db/schema";

function toTimestamp(value: Date): number {
  return value.getTime();
}

function mapConversationRow(
  row: typeof agentConversations.$inferSelect,
  messages: UIMessage[],
): AgentConversation {
  return {
    id: row.id,
    title: row.title,
    titleLocked: row.titleLocked,
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    messages,
  };
}

export async function listConversationsForUser(
  userId: string,
): Promise<AgentConversation[]> {
  const rows = await db
    .select()
    .from(agentConversations)
    .where(eq(agentConversations.userId, userId))
    .orderBy(desc(agentConversations.updatedAt));

  if (rows.length === 0) return [];

  const conversationIds = rows.map((row) => row.id);
  const messagesByConversation = new Map<string, UIMessage[]>();

  for (const conversationId of conversationIds) {
    const rowsForConversation = await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId))
      .orderBy(asc(agentMessages.orderIndex));

    messagesByConversation.set(
      conversationId,
      rowsForConversation.map((message) => ({
        id: message.id,
        role: message.role as UIMessage["role"],
        parts: message.parts as UIMessage["parts"],
      })),
    );
  }

  return rows.map((row) =>
    mapConversationRow(row, messagesByConversation.get(row.id) ?? []),
  );
}

export async function getConversationForUser(
  userId: string,
  conversationId: string,
): Promise<AgentConversation | null> {
  const [row] = await db
    .select()
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const messageRows = await db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.conversationId, conversationId))
    .orderBy(asc(agentMessages.orderIndex));

  const messages = messageRows.map((message) => ({
    id: message.id,
    role: message.role as UIMessage["role"],
    parts: message.parts as UIMessage["parts"],
  }));

  return mapConversationRow(row, messages);
}

export async function createConversationForUser(userId: string) {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(agentConversations).values({
    id,
    userId,
    title: "New chat",
    titleLocked: false,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function renameConversationForUser(
  userId: string,
  conversationId: string,
  title: string,
) {
  const trimmed = title.trim();
  if (!trimmed) return false;

  await db
    .update(agentConversations)
    .set({
      title: trimmed,
      titleLocked: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    );

  return true;
}

export async function deleteConversationForUser(
  userId: string,
  conversationId: string,
) {
  await db
    .delete(agentConversations)
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    );

  return true;
}

export async function syncConversationMessagesForUser(
  userId: string,
  conversationId: string,
  messages: UIMessage[],
) {
  const [conversation] = await db
    .select()
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    )
    .limit(1);

  if (!conversation) return false;

  await db
    .delete(agentMessages)
    .where(eq(agentMessages.conversationId, conversationId));

  if (messages.length > 0) {
    await db.insert(agentMessages).values(
      messages.map((message, index) => ({
        id: message.id,
        conversationId,
        role: message.role,
        parts: message.parts,
        orderIndex: index,
      })),
    );
  }

  const nextTitle = conversation.titleLocked
    ? conversation.title
    : deriveTitle(messages);

  await db
    .update(agentConversations)
    .set({
      title: nextTitle,
      updatedAt: new Date(),
    })
    .where(eq(agentConversations.id, conversationId));

  return true;
}

export async function importConversationsForUser(
  userId: string,
  conversations: AgentConversation[],
) {
  for (const conversation of conversations) {
    const existing = await getConversationForUser(userId, conversation.id);
    if (existing) continue;

    await db.insert(agentConversations).values({
      id: conversation.id,
      userId,
      title: conversation.title,
      titleLocked: conversation.titleLocked ?? false,
      createdAt: new Date(conversation.createdAt),
      updatedAt: new Date(conversation.updatedAt),
    });

    if (conversation.messages.length > 0) {
      await db.insert(agentMessages).values(
        conversation.messages.map((message, index) => ({
          id: message.id,
          conversationId: conversation.id,
          role: message.role,
          parts: message.parts,
          orderIndex: index,
        })),
      );
    }
  }
}
