"use client";

import { AgentChatSession } from "@/features/agent/components/agent-chat-session";
import { AgentChatSkeleton } from "@/features/agent/components/skeletons";
import { useAgentConversationsContext } from "@/features/agent/context/agent-conversations-provider";

export function AgentChatView() {
  const {
    activeId,
    activeConversation,
    isHydrated,
    updateConversationMessages,
    renameConversation,
    deleteConversation,
  } = useAgentConversationsContext();

  if (!isHydrated || !activeId || !activeConversation) {
    return <AgentChatSkeleton />;
  }

  return (
    <AgentChatSession
      key={activeId}
      conversationId={activeId}
      conversationTitle={activeConversation.title}
      initialMessages={activeConversation.messages}
      onMessagesChange={updateConversationMessages}
      onRename={renameConversation}
      onDelete={deleteConversation}
    />
  );
}
