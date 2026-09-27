"use client";

import { MessageSquare, SquarePen } from "lucide-react";
import { useMemo } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { groupConversationsByDate } from "@/features/agent/lib/agent-chat-history-groups";
import { getConversationSearchValue } from "@/features/agent/lib/agent-chat-search";
import type { AgentConversation } from "@/features/agent/types/agent.types";

type AgentChatSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: AgentConversation[];
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export function AgentChatSearchDialog({
  open,
  onOpenChange,
  conversations,
  onSelect,
  onCreate,
}: AgentChatSearchDialogProps) {
  const groups = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  );

  function handleSelect(id: string) {
    onSelect(id);
    onOpenChange(false);
  }

  function handleCreate() {
    onCreate();
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton
      title="Search chats"
      description="Search and open a previous chat"
      className="sm:max-w-lg"
    >
      <Command>
        <CommandInput placeholder="Search chats..." />
        <CommandList className="max-h-80">
          <CommandEmpty>No chats found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem value="new chat compose" onSelect={handleCreate}>
              <SquarePen className="size-4" />
              New chat
            </CommandItem>
          </CommandGroup>

          {groups.map((group, index) => (
            <div key={group.id}>
              {index === 0 ? null : <CommandSeparator />}
              <CommandGroup heading={group.label}>
                {group.conversations.map((conversation) => (
                  <CommandItem
                    key={conversation.id}
                    value={getConversationSearchValue(conversation)}
                    onSelect={() => handleSelect(conversation.id)}
                  >
                    <MessageSquare className="size-4" />
                    <span className="truncate">{conversation.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
