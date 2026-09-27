import type { UIMessage } from "ai";

import { getMessageText } from "@/features/agent/lib/agent-message-utils";

export function getLastUserMessageText(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    const text = getMessageText(message.parts).trim();
    if (text) return text;
  }
  return "";
}
