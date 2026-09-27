"use client";

import { MessageSquare } from "lucide-react";

import { AgentChatActionsMenu } from "@/features/agent/components/agent-chat-actions";
import { cn } from "@/lib/utils";

type AgentChatHistoryItemProps = {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
};

export function AgentChatHistoryItem({
  id,
  title,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: AgentChatHistoryItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-full transition-colors",
        isActive ? "bg-[var(--teal-100)]" : "hover:bg-muted/60",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
          isActive
            ? "font-semibold text-[var(--teal-900)]"
            : "text-foreground/80",
        )}
      >
        <MessageSquare className="size-[18px] shrink-0" />
        <span className="min-w-0 flex-1 truncate">{title}</span>
      </button>

      <AgentChatActionsMenu
        conversationId={id}
        title={title}
        onRename={onRename}
        onDelete={onDelete}
        align="end"
        triggerVisible="hover"
        triggerClassName="mr-1"
      />
    </div>
  );
}
