import type { AgentConversation } from "@/features/agent/types/agent.types";
import { getMessageText } from "@/features/agent/lib/agent-message-utils";

export function getConversationSearchValue(conversation: AgentConversation): string {
  const messageText = conversation.messages
    .map((message) => getMessageText(message.parts))
    .join(" ");

  return `${conversation.title} ${messageText}`.trim().toLowerCase();
}
