"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useAgentConversations } from "@/features/agent/hooks/use-agent-conversations";

type AgentConversationsContextValue = ReturnType<typeof useAgentConversations>;

const AgentConversationsContext =
  createContext<AgentConversationsContextValue | null>(null);

export function AgentConversationsProvider({ children }: { children: ReactNode }) {
  const value = useAgentConversations();

  return (
    <AgentConversationsContext.Provider value={value}>
      {children}
    </AgentConversationsContext.Provider>
  );
}

export function useAgentConversationsContext() {
  const context = useContext(AgentConversationsContext);

  if (!context) {
    throw new Error(
      "useAgentConversationsContext must be used within AgentConversationsProvider",
    );
  }

  return context;
}
