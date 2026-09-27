import { NextResponse } from "next/server";
import type { UIMessage } from "ai";

import { mockStreamResponse } from "@/server/agent/mock-stream-response";
import { createCorsairAiTools } from "@/server/agent/corsair-tools";
import { extractAgentErrorMessage } from "@/server/agent/format-agent-error";
import { getLastUserMessageText } from "@/server/agent/get-last-user-text";
import {
  resolveAgentModelForTier,
  type AgentModelTier,
} from "@/server/agent/resolve-agent-model";
import { runAgentStream } from "@/server/agent/run-agent-stream";
import { getSessionTokenFromHeader } from "@/server/auth/session-cookie";
import { resolveSessionFromToken } from "@/server/auth/resolve-session";
import {
  addConversationToMem0,
  searchUserMemories,
} from "@/server/services/agent-mem0.service";
import { getAgentCapabilities } from "@/server/services/plugin-settings.service";

export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  conversationId?: string;
  model?: {
    provider?: string;
    modelId?: string;
  };
  modelTier?: AgentModelTier;
};

export async function POST(request: Request) {
  try {
    const sessionToken = getSessionTokenFromHeader(
      request.headers.get("cookie"),
    );
    const session = await resolveSessionFromToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const messages = body.messages ?? [];
    if (messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const modelTier = body.modelTier ?? "primary";
    const model = resolveAgentModelForTier(body.model, modelTier);

    if (!model) {
      if (modelTier === "fallback") {
        return mockStreamResponse(
          "Tool calling failed and no fallback model is configured. Add **OPENAI_API_KEY** or switch to **GPT-4o Mini** in the model picker.",
        );
      }

      return mockStreamResponse(
        "Agent is not configured. Add **GROQ_API_KEY** (or OPENAI_API_KEY) in Vercel env vars, connect Gmail/Calendar on `/plugins`, and optionally **MEM0_API_KEY** for long-term memory.",
      );
    }

    const userId = session.user.id;
    const lastUserText = getLastUserMessageText(messages);

    let memories: string[] = [];
    let capabilities = { gmail: false, googlecalendar: false };

    try {
      [memories, capabilities] = await Promise.all([
        searchUserMemories(userId, lastUserText),
        getAgentCapabilities(userId),
      ]);
    } catch (error) {
      console.warn("[agent/chat] capabilities/memories load failed:", error);
    }

    const corsairTools = await createCorsairAiTools(userId, { capabilities });

    const effectiveModelId =
      modelTier === "fallback" && body.model?.provider === "groq"
        ? "llama-3.3-70b-versatile"
        : body.model?.modelId;

    const result = await runAgentStream({
      model,
      modelId: effectiveModelId,
      messages,
      tools: corsairTools,
      memories,
      userName: session.user.fullName,
      capabilities,
      onFinish: async (text) => {
        if (!body.conversationId || !lastUserText) return;
        await addConversationToMem0(
          userId,
          body.conversationId,
          lastUserText,
          text,
        );
      },
    });

    const response = result.toUIMessageStreamResponse({
      onError: extractAgentErrorMessage,
    });
    if (modelTier === "fallback") {
      response.headers.set("X-Agent-Model-Tier", "fallback");
    }
    return response;
  } catch (error) {
    console.error("[agent/chat] unhandled:", error);
    return mockStreamResponse(extractAgentErrorMessage(error));
  }
}
