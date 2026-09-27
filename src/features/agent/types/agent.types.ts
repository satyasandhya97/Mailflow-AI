import type { UIMessage } from "ai";

export type AgentProvider = "groq" | "openai" | "anthropic" | "google";

export type AgentModelSelection = {
  provider: AgentProvider;
  modelId: string;
};

export type AgentModelOption = AgentModelSelection & {
  label: string;
  description?: string;
};

export type AgentConversation = {
  id: string;
  title: string;
  titleLocked?: boolean;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
};
