import type { ChatStatus, UIMessage } from "ai";

export function getMessageText(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

export function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return "New chat";

  const text = getMessageText(firstUser.parts).trim();
  if (!text) return "New chat";
  if (text.length <= 48) return text;
  return `${text.slice(0, 48).trim()}…`;
}

export function shouldShowAgentTypingIndicator(
  messages: UIMessage[],
  status: ChatStatus,
): boolean {
  if (status === "submitted") return true;
  if (status !== "streaming") return false;

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  if (!lastAssistant) return true;

  return !getMessageText(lastAssistant.parts).trim();
}

export function getTypingIndicatorLabel(
  messages: UIMessage[],
  status: ChatStatus,
): string {
  if (status !== "streaming") return "Agent is typing";

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  const hasTools = lastAssistant?.parts.some(
    (part) => part.type.startsWith("tool-") || part.type === "dynamic-tool",
  );

  return hasTools ? "Agent is working" : "Agent is typing";
}
