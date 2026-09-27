import { MemoryClient } from "mem0ai";

import { env } from "@/env";

const MEM0_APP_ID = "corsair-workspace";

let client: MemoryClient | null = null;

export function isMem0Enabled() {
  return env.MEM0_ENABLED && Boolean(env.MEM0_API_KEY);
}

function getMem0Client() {
  if (!isMem0Enabled()) return null;

  client ??= new MemoryClient({ apiKey: env.MEM0_API_KEY! });
  return client;
}

export async function searchUserMemories(userId: string, query: string) {
  const mem0 = getMem0Client();
  if (!mem0 || !query.trim()) return [];

  try {
    const response = await mem0.search(query, {
      filters: { AND: [{ user_id: userId }] },
      topK: 5,
      threshold: 0.1,
    });

    return response.results
      .map((item) => item.memory ?? item.data?.memory ?? "")
      .filter(Boolean);
  } catch (error) {
    console.error("[agent/mem0] search failed", error);
    return [];
  }
}

export async function addConversationToMem0(
  userId: string,
  conversationId: string,
  userText: string,
  assistantText: string,
) {
  const mem0 = getMem0Client();
  if (!mem0) return;

  const userMessage = userText.trim();
  const assistantMessage = assistantText.trim();
  if (!userMessage || !assistantMessage) return;

  try {
    await mem0.add(
      [
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantMessage },
      ],
      {
        user_id: userId,
        app_id: MEM0_APP_ID,
        metadata: { conversationId, source: "corsair-agent" },
      },
    );
  } catch (error) {
    console.error("[agent/mem0] add failed", error);
  }
}
