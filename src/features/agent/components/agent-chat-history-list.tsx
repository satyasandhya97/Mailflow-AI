"use client";

import { useMemo } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AgentChatHistoryItem } from "@/features/agent/components/agent-chat-history-item";
import { groupConversationsByDate } from "@/features/agent/lib/agent-chat-history-groups";
import type { AgentConversation } from "@/features/agent/types/agent.types";

type AgentChatHistoryListProps = {
  conversations: AgentConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
};

export function AgentChatHistoryList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
}: AgentChatHistoryListProps) {
  const groups = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  );

  const defaultOpenGroups = useMemo(
    () => groups.map((group) => group.id),
    [groups],
  );

  if (groups.length === 0) {
    return (
      <p className="px-4 py-2 text-xs text-muted-foreground">No chats yet.</p>
    );
  }

  return (
    <Accordion
      multiple
      defaultValue={defaultOpenGroups}
      className="min-h-0 flex-1 gap-1 overflow-y-auto"
    >
      {groups.map((group) => (
        <AccordionItem key={group.id} value={group.id} className="border-none">
          <AccordionTrigger className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:no-underline">
            {group.label}
          </AccordionTrigger>
          <AccordionContent className="pb-1">
            <div className="flex flex-col gap-0.5">
              {group.conversations.map((conversation) => (
                <AgentChatHistoryItem
                  key={conversation.id}
                  id={conversation.id}
                  title={conversation.title}
                  isActive={conversation.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
