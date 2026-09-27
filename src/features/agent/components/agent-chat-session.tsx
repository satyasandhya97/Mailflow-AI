"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import { Bot } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { MessageResponse } from "@/components/ai-elements/message";
import { AgentChatHeader } from "@/features/agent/components/agent-chat-header";
import { AgentComposer } from "@/features/agent/components/agent-composer";
import { AgentMessageBubble } from "@/features/agent/components/agent-message-bubble";
import { AgentTypingIndicator } from "@/features/agent/components/agent-typing-indicator";
import { useAgentModel } from "@/features/agent/hooks/use-agent-model";
import { AGENT_SYSTEM_PLACEHOLDER } from "@/features/agent/lib/agent.constants";
import {
  messagesTouchCalendarMutation,
  messagesTouchGmailList,
  messagesTouchGmailMutation,
  messagesTouchTaskMutation,
} from "@/features/agent/lib/agent-tool-ui";
import {
  getTypingIndicatorLabel,
  shouldShowAgentTypingIndicator,
} from "@/features/agent/lib/agent-message-utils";
import {
  formatAgentErrorMessage,
  isAgentRetriableErrorMessage,
} from "@/features/agent/lib/agent-tool-errors";
import type { AgentModelSelection } from "@/features/agent/types/agent.types";
import { api } from "@/trpc/react";

type AgentChatSessionProps = {
  conversationId: string;
  conversationTitle: string;
  initialMessages: UIMessage[];
  onMessagesChange: (conversationId: string, messages: UIMessage[]) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

export function AgentChatSession({
  conversationId,
  conversationTitle,
  initialMessages,
  onMessagesChange,
  onRename,
  onDelete,
}: AgentChatSessionProps) {
  const [seedMessages] = useState(initialMessages);
  const { model, modelKey, setModelKey, models } = useAgentModel();
  const modelRef = useRef<AgentModelSelection>(model);
  const conversationIdRef = useRef(conversationId);
  const modelTierRef = useRef<"primary" | "fallback">("primary");
  const retriedWithFallbackRef = useRef(false);

  modelRef.current = model;
  conversationIdRef.current = conversationId;

  const utils = api.useUtils();
  const lastCalendarInvalidateKeyRef = useRef("");
  const lastGmailInvalidateKeyRef = useRef("");
  const lastTaskInvalidateKeyRef = useRef("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          model: modelRef.current,
          conversationId: conversationIdRef.current,
          modelTier: modelTierRef.current,
        }),
      }),
    [],
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    addToolApprovalResponse,
  } = useChat({
    id: conversationId,
    messages: seedMessages,
    transport,
    experimental_throttle: 50,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isBusy = status === "submitted" || status === "streaming";
  const onMessagesChangeRef = useRef(onMessagesChange);
  const lastSyncedSnapshotRef = useRef(JSON.stringify(seedMessages));

  onMessagesChangeRef.current = onMessagesChange;

  useEffect(() => {
    modelTierRef.current = "primary";
    retriedWithFallbackRef.current = false;
  }, [modelKey, conversationId]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") return;

    const snapshot = JSON.stringify(messages);
    if (snapshot === lastSyncedSnapshotRef.current) return;

    lastSyncedSnapshotRef.current = snapshot;
    onMessagesChangeRef.current(conversationId, messages);
  }, [conversationId, messages, status]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") return;
    if (!messagesTouchCalendarMutation(messages)) return;

    const turnKey = `${conversationId}:${messages.length}:${messages.at(-1)?.id ?? ""}`;
    if (turnKey === lastCalendarInvalidateKeyRef.current) return;

    lastCalendarInvalidateKeyRef.current = turnKey;
    void utils.calendar.searchEvents.invalidate();
    void utils.calendar.listCalendars.invalidate();
  }, [conversationId, messages, status, utils]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") return;
    if (
      !messagesTouchGmailMutation(messages) &&
      !messagesTouchGmailList(messages)
    ) {
      return;
    }

    const turnKey = `${conversationId}:${messages.length}:${messages.at(-1)?.id ?? ""}`;
    if (turnKey === lastGmailInvalidateKeyRef.current) return;

    lastGmailInvalidateKeyRef.current = turnKey;
    void utils.gmail.listSent.invalidate();
    void utils.gmail.searchEmails.invalidate();
  }, [conversationId, messages, status, utils]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") return;
    if (!messagesTouchTaskMutation(messages)) return;

    const turnKey = `${conversationId}:${messages.length}:${messages.at(-1)?.id ?? ""}`;
    if (turnKey === lastTaskInvalidateKeyRef.current) return;

    lastTaskInvalidateKeyRef.current = turnKey;
    void utils.tasks.listBoard.invalidate();
    void utils.tasks.countActive.invalidate();
    void utils.tasks.listLabels.invalidate();
  }, [conversationId, messages, status, utils]);

  useEffect(() => {
    if (!error || retriedWithFallbackRef.current) return;
    if (!isAgentRetriableErrorMessage(error.message)) return;

    retriedWithFallbackRef.current = true;
    modelTierRef.current = "fallback";
    void regenerate();
  }, [error, regenerate]);

  function handleToolApproval(approvalId: string, approved: boolean) {
    void addToolApprovalResponse({
      id: approvalId,
      approved,
      reason: approved ? "User confirmed in chat UI" : "User cancelled in chat UI",
    });
  }

  function handleSubmit(text: string) {
    modelTierRef.current = "primary";
    retriedWithFallbackRef.current = false;
    void sendMessage({ text });
  }

  const errorMessage = error
    ? formatAgentErrorMessage(
        retriedWithFallbackRef.current
          ? `${error.message} (retried with fallback model)`
          : error.message,
      )
    : null;

  const showTypingIndicator = shouldShowAgentTypingIndicator(messages, status);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)]">
      <AgentChatHeader
        conversationId={conversationId}
        title={conversationTitle}
        onRename={onRename}
        onDelete={onDelete}
      />

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 pb-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="What should we handle?"
              description={AGENT_SYSTEM_PLACEHOLDER}
              icon={<Bot className="size-10" />}
            />
          ) : (
            messages.map((message, index) => {
              const isLastAssistant =
                message.role === "assistant" && index === messages.length - 1;

              return (
                <AgentMessageBubble
                  key={message.id}
                  message={message}
                  isAnimating={isBusy && isLastAssistant}
                  onToolApproval={
                    message.role === "assistant" ? handleToolApproval : undefined
                  }
                  approvalDisabled={isBusy}
                />
              );
            })
          )}

          {showTypingIndicator && !errorMessage ? (
            <AgentTypingIndicator
              label={getTypingIndicatorLabel(messages, status)}
            />
          ) : null}

          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive [&_p]:leading-relaxed">
              <MessageResponse>{errorMessage}</MessageResponse>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <AgentComposer
        models={models}
        modelKey={modelKey}
        onModelChange={setModelKey}
        status={status}
        onStop={stop}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
