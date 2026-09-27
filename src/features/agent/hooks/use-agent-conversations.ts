"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AGENT_CONVERSATIONS_STORAGE_KEY } from "@/features/agent/lib/agent.constants";
import type { AgentConversation } from "@/features/agent/types/agent.types";
import { api } from "@/trpc/react";

const EMPTY_CONVERSATIONS: AgentConversation[] = [];

function loadLocalConversations(): AgentConversation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(AGENT_CONVERSATIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AgentConversation[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        Array.isArray(item.messages),
    );
  } catch {
    return [];
  }
}

export function useAgentConversations() {
  const utils = api.useUtils();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const initCompletedRef = useRef(false);
  const lastSyncedMessagesRef = useRef<Map<string, string>>(new Map());
  const syncTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const listQuery = api.agent.listConversations.useQuery(undefined, {
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const createMutation = api.agent.createConversation.useMutation({
    onSuccess: (result) => {
      const now = Date.now();
      utils.agent.listConversations.setData(undefined, (current) => {
        const existing = current ?? [];
        if (existing.some((conversation) => conversation.id === result.id)) {
          return existing;
        }

        return [
          {
            id: result.id,
            title: "New chat",
            titleLocked: false,
            createdAt: now,
            updatedAt: now,
            messages: [],
          },
          ...existing,
        ];
      });
    },
  });

  const renameMutation = api.agent.renameConversation.useMutation({
    onSuccess: async () => {
      await utils.agent.listConversations.invalidate();
    },
  });

  const deleteMutation = api.agent.deleteConversation.useMutation({
    onSuccess: async () => {
      await utils.agent.listConversations.invalidate();
    },
  });

  const syncMutation = api.agent.syncMessages.useMutation({
    onSuccess: (_result, variables) => {
      utils.agent.listConversations.setData(undefined, (current) => {
        if (!current) return current;

        const now = Date.now();
        return current.map((conversation) =>
          conversation.id === variables.conversationId
            ? {
                ...conversation,
                messages: variables.messages,
                updatedAt: now,
              }
            : conversation,
        );
      });
    },
  });

  const importMutation = api.agent.importFromLocalStorage.useMutation({
    onSuccess: () => {
      localStorage.removeItem(AGENT_CONVERSATIONS_STORAGE_KEY);
    },
  });

  const conversations = listQuery.data ?? EMPTY_CONVERSATIONS;
  const loadError =
    readyState === "error"
      ? (listQuery.error?.message ?? "Failed to load conversations")
      : null;

  useEffect(() => {
    if (!listQuery.isFetched || initCompletedRef.current) return;

    if (listQuery.isError) {
      setReadyState("error");
      return;
    }

    if (!listQuery.isSuccess) return;

    initCompletedRef.current = true;

    async function initialize() {
      try {
        const local = loadLocalConversations();
        let latest =
          utils.agent.listConversations.getData(undefined) ?? EMPTY_CONVERSATIONS;

        if (local.length > 0 && latest.length === 0) {
          await importMutation.mutateAsync({ conversations: local });
          await utils.agent.listConversations.refetch();
          latest =
            utils.agent.listConversations.getData(undefined) ??
            EMPTY_CONVERSATIONS;
        }

        if (latest.length === 0) {
          const created = await createMutation.mutateAsync();
          setActiveId(created.id);
        } else {
          setActiveId(latest[0]!.id);
        }

        setReadyState("ready");
      } catch {
        initCompletedRef.current = false;
        setReadyState("error");
      }
    }

    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after first fetch
  }, [listQuery.isError, listQuery.isFetched, listQuery.isSuccess]);

  useEffect(() => {
    return () => {
      for (const timer of syncTimersRef.current.values()) {
        clearTimeout(timer);
      }
      syncTimersRef.current.clear();
    };
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [activeId, conversations],
  );

  const createConversation = useCallback(async () => {
    const result = await createMutation.mutateAsync();
    setActiveId(result.id);
    setReadyState("ready");
    return result.id;
  }, [createMutation]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync({ id });

      if (activeId === id) {
        const next = conversations.find((conversation) => conversation.id !== id);
        if (next) {
          setActiveId(next.id);
        } else {
          const created = await createMutation.mutateAsync();
          setActiveId(created.id);
        }
      }
    },
    [activeId, conversations, createMutation, deleteMutation],
  );

  const updateConversationMessages = useCallback(
    (id: string, messages: UIMessage[]) => {
      const snapshot = JSON.stringify(messages);
      if (lastSyncedMessagesRef.current.get(id) === snapshot) return;

      const existing = syncTimersRef.current.get(id);
      if (existing) clearTimeout(existing);

      syncTimersRef.current.set(
        id,
        setTimeout(() => {
          syncTimersRef.current.delete(id);
          lastSyncedMessagesRef.current.set(id, snapshot);
          syncMutation.mutate({ conversationId: id, messages });
        }, 600),
      );
    },
    [syncMutation],
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      await renameMutation.mutateAsync({ id, title });
    },
    [renameMutation],
  );

  const retryLoad = useCallback(() => {
    initCompletedRef.current = false;
    setReadyState("loading");
    void listQuery.refetch();
  }, [listQuery]);

  return useMemo(
    () => ({
      conversations,
      activeId,
      activeConversation,
      isHydrated: readyState === "ready",
      loadError,
      retryLoad,
      createConversation,
      selectConversation,
      deleteConversation,
      updateConversationMessages,
      renameConversation,
    }),
    [
      activeConversation,
      activeId,
      conversations,
      createConversation,
      deleteConversation,
      loadError,
      readyState,
      renameConversation,
      retryLoad,
      selectConversation,
      updateConversationMessages,
    ],
  );
}
