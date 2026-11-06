"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
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
    <header className="flex shrink-0 items-center justify-between border-b border-border/40 px-3 py-2 bg-background/50">
      <div className="flex items-center gap-1.5 min-w-0">
        <SidebarTrigger className="size-7 shrink-0 text-muted-foreground hover:text-foreground md:hidden" />
        <h2 className="min-w-0 truncate text-sm font-medium tracking-tight text-foreground/90">
          {title}
        </h2>
        <AgentChatActionsMenu
          conversationId={conversationId}
          title={title}
          onRename={onRename}
          onDelete={onDelete}
          align="start"
        />
      </div>
    </header>
  );
}
