import type { AgentModelOption, AgentProvider } from "@/features/agent/types/agent.types";

export const AGENT_PROVIDER_LABELS: Record<AgentProvider, string> = {
  groq: "Groq",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

export function getAgentProviderLabel(provider: AgentProvider): string {
  return AGENT_PROVIDER_LABELS[provider];
}

/** Groq model IDs that were removed — mapped to current defaults on the server. */
export const DEPRECATED_GROQ_MODEL_IDS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
]);

export const AGENT_MODELS: AgentModelOption[] = [
  {
    provider: "openai",
    modelId: "gpt-4o-mini",
    label: "GPT-4o Mini",
    description: "OpenAI — recommended for tools",
  },
  {
    provider: "groq",
    modelId: "llama-3.1-70b-versatile",
    label: "Llama 3.1 70B",
    description: "Groq — reliable tool calling",
  },
  {
    provider: "groq",
    modelId: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    description: "Groq — reasoning; low 8k TPM limit",
  },
  {
    provider: "anthropic",
    modelId: "claude-sonnet-4-20250514",
    label: "Claude Sonnet",
    description: "Anthropic",
  },
  {
    provider: "google",
    modelId: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Google",
  },
];

export const DEFAULT_AGENT_MODEL = AGENT_MODELS.find(m => m.provider === "google") || AGENT_MODELS[0]!;

export function getAgentModelKey(model: {
  provider: string;
  modelId: string;
}): string {
  return `${model.provider}:${model.modelId}`;
}

export function findAgentModel(key: string): AgentModelOption | undefined {
  return AGENT_MODELS.find((m) => getAgentModelKey(m) === key);
}

export function normalizeStoredModelKey(stored: string): string | null {
  if (!stored.includes(":")) return null;

  const [, modelId] = stored.split(":");
  if (modelId && DEPRECATED_GROQ_MODEL_IDS.has(modelId)) {
    return getAgentModelKey(DEFAULT_AGENT_MODEL);
  }

  if (findAgentModel(stored)) {
    return stored;
  }

  return null;
}
