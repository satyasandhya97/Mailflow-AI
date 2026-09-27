"use client";

import { AgentChatActionsMenu } from "@/features/agent/components/agent-chat-actions";

type AgentChatHeaderProps = {
  conversationId: string;
  title: string;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

export function AgentChatHeader({
  conversationId,
  title,
  onRename,
  onDelete,
}: AgentChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-0.5  px-4 py-2">
      <h2 className="min-w-0 truncate text-sm font-medium tracking-tight">
        {title}
      </h2>
      <AgentChatActionsMenu
        conversationId={conversationId}
        title={title}
        onRename={onRename}
        onDelete={onDelete}
        align="start"
      />
    </header>
  );
}
