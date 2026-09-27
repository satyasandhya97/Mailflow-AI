import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type StreamTextResult,
  type ToolSet,
  type UIMessage,
} from "ai";
import type { LanguageModel } from "ai";

import { buildAgentSystemPrompt } from "@/server/agent/build-agent-system-prompt";
import { prepareAgentMessagesForModel } from "@/server/agent/sanitize-agent-messages";
import type { AgentCapabilities } from "@/server/services/plugin-settings.service";

const AGENT_MAX_TOOL_STEPS = 10;

type RunAgentStreamOptions = {
  model: LanguageModel;
  modelId?: string;
  messages: UIMessage[];
  tools: ToolSet;
  memories: string[];
  userName?: string;
  capabilities?: AgentCapabilities;
  onFinish?: (text: string) => Promise<void>;
};

export async function runAgentStream({
  model,
  modelId,
  messages,
  tools,
  memories,
  userName,
  capabilities,
  onFinish,
}: RunAgentStreamOptions): Promise<StreamTextResult<ToolSet, never>> {
  const sanitizedMessages = prepareAgentMessagesForModel(messages, modelId);

  return streamText({
    model,
    system: buildAgentSystemPrompt({ memories, userName, capabilities }),
    messages: await convertToModelMessages(sanitizedMessages),
    tools,
    stopWhen: stepCountIs(AGENT_MAX_TOOL_STEPS),
    onError: ({ error }) => {
      console.error("[agent/chat]", error);
    },
    onFinish: async ({ text }) => {
      if (!onFinish || !text.trim()) return;
      await onFinish(text);
    },
  });
}
