import { z } from "zod";
import type { UIMessage } from "ai";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createConversationForUser,
  deleteConversationForUser,
  importConversationsForUser,
  listConversationsForUser,
  renameConversationForUser,
  syncConversationMessagesForUser,
} from "@/server/services/agent-conversation.service";
import { isMem0Enabled } from "@/server/services/agent-mem0.service";
import {
  getAgentProviderAvailability,
  getRecommendedAgentModel,
} from "@/server/agent/resolve-agent-model";

const uiMessageSchema = z.custom<UIMessage>((value) => {
  if (!value || typeof value !== "object") return false;
  const message = value as UIMessage;
  return (
    typeof message.id === "string" &&
    typeof message.role === "string" &&
    Array.isArray(message.parts)
  );
});

const agentConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleLocked: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(uiMessageSchema),
});

export const agentRouter = createTRPCRouter({
  status: protectedProcedure.query(() => {
    const recommended = getRecommendedAgentModel();
    return {
      ready: true,
      mem0: isMem0Enabled(),
      providers: getAgentProviderAvailability(),
      recommendedModelKey: `${recommended.provider}:${recommended.modelId}`,
      message:
        "Corsair agent uses dedicated Gmail/Calendar tools plus Corsair MCP (corsair_setup). MCP HTTP: /api/mcp",
    };
  }),

  listConversations: protectedProcedure.query(async ({ ctx }) => {
    return listConversationsForUser(ctx.session.user.id);
  }),

  createConversation: protectedProcedure.mutation(async ({ ctx }) => {
    const id = await createConversationForUser(ctx.session.user.id);
    return { id };
  }),

  renameConversation: protectedProcedure
    .input(z.object({ id: z.string().min(1), title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ok = await renameConversationForUser(
        ctx.session.user.id,
        input.id,
        input.title,
      );
      return { ok };
    }),

  deleteConversation: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteConversationForUser(ctx.session.user.id, input.id);
      return { ok };
    }),

  syncMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        messages: z.array(uiMessageSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ok = await syncConversationMessagesForUser(
        ctx.session.user.id,
        input.conversationId,
        input.messages,
      );
      return { ok };
    }),

  importFromLocalStorage: protectedProcedure
    .input(z.object({ conversations: z.array(agentConversationSchema) }))
    .mutation(async ({ ctx, input }) => {
      await importConversationsForUser(
        ctx.session.user.id,
        input.conversations,
      );
      return { ok: true };
    }),
});
