"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AGENT_MODELS,
  DEFAULT_AGENT_MODEL,
  findAgentModel,
  getAgentModelKey,
  normalizeStoredModelKey,
} from "@/features/agent/lib/agent-models";
import { AGENT_MODEL_STORAGE_KEY } from "@/features/agent/lib/agent.constants";
import type { AgentModelSelection } from "@/features/agent/types/agent.types";
import { api } from "@/trpc/react";

export function useAgentModel() {
  const statusQuery = api.agent.status.useQuery(undefined, {
    staleTime: 60_000,
  });

  const [modelKey, setModelKeyState] = useState(() =>
    getAgentModelKey(DEFAULT_AGENT_MODEL),
  );

  useEffect(() => {
    const stored = localStorage.getItem(AGENT_MODEL_STORAGE_KEY);

    if (stored) {
      const normalized = normalizeStoredModelKey(stored);
      if (normalized) {
        setModelKeyState(normalized);
        if (normalized !== stored) {
          localStorage.setItem(AGENT_MODEL_STORAGE_KEY, normalized);
        }
        return;
      }
    }

    const recommended = statusQuery.data?.recommendedModelKey;
    if (recommended && findAgentModel(recommended)) {
      setModelKeyState(recommended);
    }
  }, [statusQuery.data?.recommendedModelKey]);

  const setModelKey = useCallback((key: string) => {
    if (!findAgentModel(key)) return;
    setModelKeyState(key);
    localStorage.setItem(AGENT_MODEL_STORAGE_KEY, key);
  }, []);

  const models = useMemo(() => {
    const providers = statusQuery.data?.providers;
    if (!providers) return AGENT_MODELS;

    const available = AGENT_MODELS.filter((m) => providers[m.provider]);
    return available.length > 0 ? available : AGENT_MODELS;
  }, [statusQuery.data?.providers]);

  const model: AgentModelSelection =
    findAgentModel(modelKey) ?? DEFAULT_AGENT_MODEL;

  return {
    model,
    modelKey,
    setModelKey,
    models,
  };
}
