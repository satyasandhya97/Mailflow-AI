import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { DEPRECATED_GROQ_MODEL_IDS } from "@/features/agent/lib/agent-models";
import type { AgentModelOption } from "@/features/agent/types/agent.types";
import { env } from "@/env";

export type AgentModelInput = {
  provider?: string;
  modelId?: string;
};

export type AgentModelTier = "primary" | "fallback";

const GROQ_MODELS = new Set([
  "llama-3.1-70b-versatile",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
]);

const DEFAULT_GROQ_MODEL = "llama-3.1-70b-versatile";
const DEFAULT_GROQ_FALLBACK = "openai/gpt-oss-120b";

const GROQ_LLAMA_FALLBACK = "llama-3.1-70b-versatile";

const FALLBACK_MODELS: AgentModelOption[] = [
  { provider: "openai", modelId: "gpt-4o-mini", label: "", description: "" },
  { provider: "groq", modelId: GROQ_LLAMA_FALLBACK, label: "", description: "" },
  {
    provider: "anthropic",
    modelId: "claude-sonnet-4-20250514",
    label: "",
    description: "",
  },
  {
    provider: "google",
    modelId: "gemini-2.0-flash",
    label: "",
    description: "",
  },
];

function resolveGroqModelId(modelId: string | undefined): string {
  if (!modelId || DEPRECATED_GROQ_MODEL_IDS.has(modelId)) {
    return DEFAULT_GROQ_MODEL;
  }

  if (!GROQ_MODELS.has(modelId)) {
    return DEFAULT_GROQ_MODEL;
  }

  return modelId;
}

function hasProviderKey(provider: AgentModelOption["provider"]): boolean {
  switch (provider) {
    case "groq":
      return Boolean(env.GROQ_API_KEY);
    case "openai":
      return Boolean(env.OPENAI_API_KEY);
    case "anthropic":
      return Boolean(env.ANTHROPIC_API_KEY);
    case "google":
      return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
}

function resolveAgentModel(input?: AgentModelInput): LanguageModel | null {
  const provider = input?.provider ?? "groq";

  if (provider === "groq" && env.GROQ_API_KEY) {
    return groq(resolveGroqModelId(input?.modelId));
  }

  if (provider === "openai" && env.OPENAI_API_KEY) {
    return openai(input?.modelId ?? "gpt-4o-mini");
  }

  if (provider === "anthropic" && env.ANTHROPIC_API_KEY) {
    return anthropic(input?.modelId ?? "claude-sonnet-4-20250514");
  }

  if (provider === "google" && env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google(input?.modelId ?? "gemini-2.0-flash");
  }

  if (env.GROQ_API_KEY) {
    return groq(DEFAULT_GROQ_MODEL);
  }

  if (env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }

  return null;
}

function resolveAgentToolModel(input?: AgentModelInput): LanguageModel | null {
  if (input?.provider) {
    return resolveAgentModel(input);
  }

  for (const candidate of FALLBACK_MODELS) {
    if (hasProviderKey(candidate.provider)) {
      return resolveAgentModel({
        provider: candidate.provider,
        modelId: candidate.modelId,
      });
    }
  }

  return null;
}

function resolveAgentToolFallbackModel(
  input?: AgentModelInput,
): LanguageModel | null {
  const primaryProvider = input?.provider;
  const primaryModelId = input?.modelId;

  if (
    primaryProvider === "groq" &&
    primaryModelId &&
    (primaryModelId.includes("gpt-oss") ||
      primaryModelId === DEFAULT_GROQ_FALLBACK) &&
    env.GROQ_API_KEY
  ) {
    return groq(GROQ_LLAMA_FALLBACK);
  }

  for (const candidate of FALLBACK_MODELS) {
    if (candidate.provider === primaryProvider) continue;
    if (!hasProviderKey(candidate.provider)) continue;

    return resolveAgentModel({
      provider: candidate.provider,
      modelId: candidate.modelId,
    });
  }

  return null;
}

export function resolveAgentModelForTier(
  input: AgentModelInput | undefined,
  tier: AgentModelTier,
): LanguageModel | null {
  if (tier === "fallback") {
    return resolveAgentToolFallbackModel(input);
  }
  return resolveAgentToolModel(input);
}

export function getRecommendedAgentModel(): AgentModelOption {
  if (env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      modelId: "gpt-4o-mini",
      label: "GPT-4o Mini",
      description: "OpenAI — recommended for tools",
    };
  }

  if (env.GROQ_API_KEY) {
    return {
      provider: "groq",
      modelId: DEFAULT_GROQ_MODEL,
      label: "Llama 3.1 70B",
      description: "Groq — reliable tool calling",
    };
  }

  for (const candidate of FALLBACK_MODELS) {
    if (hasProviderKey(candidate.provider)) {
      return candidate;
    }
  }

  return {
    provider: "groq",
    modelId: DEFAULT_GROQ_FALLBACK,
    label: "GPT-OSS 120B",
    description: "Groq",
  };
}

export function getAgentProviderAvailability() {
  return {
    groq: hasProviderKey("groq"),
    openai: hasProviderKey("openai"),
    anthropic: hasProviderKey("anthropic"),
    google: hasProviderKey("google"),
  };
}
