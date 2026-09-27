import type { UIMessage } from "ai";
import { isTextUIPart, isToolUIPart } from "ai";

const REASONING_MODEL_IDS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
]);

const HIGH_TPM_RISK_MODELS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
]);

/** Removed from agent — strip so Groq doesn't replay invalid tool calls. */
const STRIP_FROM_HISTORY_TOOLS = new Set([
  "list_operations",
  "get_schema",
  "run_script",
]);

const DEFAULT_MAX_MESSAGES = 12;
const TIGHT_MAX_MESSAGES = 8;
const ASSISTANT_TURNS_KEEPING_TOOLS = 2;
const MAX_TOOL_OUTPUT_CHARS = 1200;

function getToolPartName(part: {
  type: string;
  toolName?: string;
}): string | null {
  if (part.type === "dynamic-tool" && part.toolName) {
    return part.toolName;
  }
  if (part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length);
  }
  return null;
}

function shouldStripToolPart(part: {
  type: string;
  state?: string;
  toolName?: string;
}): boolean {
  const name = getToolPartName(part);
  if (name !== null && STRIP_FROM_HISTORY_TOOLS.has(name)) {
    return true;
  }

  if (
    part.state === "output-error" ||
    part.state === "input-streaming" ||
    part.state === "input-available"
  ) {
    return true;
  }

  return false;
}

function truncateToolOutput(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > MAX_TOOL_OUTPUT_CHARS
      ? `${value.slice(0, MAX_TOOL_OUTPUT_CHARS)}… [truncated]`
      : value;
  }

  if (typeof value === "object" && value !== null) {
    try {
      const text = JSON.stringify(value);
      if (text.length <= MAX_TOOL_OUTPUT_CHARS) return value;
      return `${text.slice(0, MAX_TOOL_OUTPUT_CHARS)}… [truncated]`;
    } catch {
      return value;
    }
  }

  return value;
}

function trimToolPartOutput<T extends { output?: unknown }>(part: T): T {
  if (part.output === undefined) return part;
  return { ...part, output: truncateToolOutput(part.output) };
}

function messageHasVisibleContent(message: UIMessage): boolean {
  if (message.role === "user") {
    return message.parts.some(
      (part) => isTextUIPart(part) && part.text.trim().length > 0,
    );
  }

  if (message.role === "assistant") {
    return message.parts.some((part) => {
      if (isTextUIPart(part) && part.text.trim().length > 0) return true;
      if (isToolUIPart(part) && !shouldStripToolPart(part)) return true;
      return false;
    });
  }

  return message.parts.length > 0;
}

function stripToolPartsFromOlderAssistantTurns(
  messages: UIMessage[],
): UIMessage[] {
  const assistantIndices = messages
    .map((message, index) => (message.role === "assistant" ? index : -1))
    .filter((index) => index >= 0);

  const keepToolIndices = new Set(
    assistantIndices.slice(-ASSISTANT_TURNS_KEEPING_TOOLS),
  );

  return messages.map((message, index) => {
    if (message.role !== "assistant" || keepToolIndices.has(index)) {
      return message;
    }

    return {
      ...message,
      parts: message.parts.filter((part) => !isToolUIPart(part)),
    };
  });
}

function limitMessageCount(messages: UIMessage[], maxMessages: number): UIMessage[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
}

export function modelSupportsReasoning(modelId: string | undefined): boolean {
  if (!modelId) return false;
  return REASONING_MODEL_IDS.has(modelId);
}

function maxMessagesForModel(modelId: string | undefined): number {
  if (modelId && HIGH_TPM_RISK_MODELS.has(modelId)) {
    return TIGHT_MAX_MESSAGES;
  }
  return DEFAULT_MAX_MESSAGES;
}

export function sanitizeAgentMessagesForModel(
  messages: UIMessage[],
  modelId: string | undefined,
): UIMessage[] {
  return messages
    .map((message) => ({
      ...message,
      parts: message.parts
        .filter((part) => {
          if (!modelSupportsReasoning(modelId) && part.type === "reasoning") {
            return false;
          }
          if (isToolUIPart(part) && shouldStripToolPart(part)) {
            return false;
          }
          return true;
        })
        .map((part) => {
          if (!isToolUIPart(part)) return part;
          if (part.state !== "output-available") return part;
          return trimToolPartOutput(part);
        }),
    }))
    .filter(messageHasVisibleContent);
}

/** Sanitize + trim history to stay under Groq TPM limits. */
export function prepareAgentMessagesForModel(
  messages: UIMessage[],
  modelId: string | undefined,
): UIMessage[] {
  const sanitized = sanitizeAgentMessagesForModel(messages, modelId);
  const withoutOldTools = stripToolPartsFromOlderAssistantTurns(sanitized);
  return limitMessageCount(withoutOldTools, maxMessagesForModel(modelId));
}
