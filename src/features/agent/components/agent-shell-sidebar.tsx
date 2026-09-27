"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Plug, Search, SquarePen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AgentChatHistoryList } from "@/features/agent/components/agent-chat-history-list";
import { AgentChatSearchDialog } from "@/features/agent/components/agent-chat-search-dialog";
import { usePluginWorkspace } from "@/features/plugins/context/plugin-workspace-provider";
import type { AgentConversation } from "@/features/agent/types/agent.types";
import { cn } from "@/lib/utils";

type AgentShellSidebarProps = {
  conversations: AgentConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
};

export function AgentShellSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: AgentShellSidebarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const { isInstalled, state, isHydrated } = usePluginWorkspace();

  const connectedCount = useMemo(() => {
    if (!isHydrated) return 0;
    return (["gmail", "googlecalendar"] as const).filter(
      (pluginId) =>
        isInstalled(pluginId) && state.connections[pluginId] === "connected",
    ).length;
  }, [isHydrated, isInstalled, state.connections]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <aside className="flex w-[220px] shrink-0 flex-col gap-4 overflow-hidden pr-2  py-2">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <span className="truncate text-base font-semibold tracking-tight">
              Agent
            </span>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="h-10 gap-4 rounded-full"
          onClick={onCreate}
        >
          <SquarePen className="size-5" />
          New chat
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-10 justify-start gap-3 rounded-full border-border/60 bg-muted/30 px-4 font-normal text-muted-foreground shadow-none"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4 shrink-0" />
          <span className="truncate">Search chats</span>
          <kbd className="ml-auto hidden rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </Button>

        <Link
          href="/plugins"
          className={cn(
            "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors",
            pathname.startsWith("/plugins")
              ? "bg-[var(--teal-100)] font-semibold text-[var(--teal-900)]"
              : "text-foreground/80 hover:bg-muted/60",
          )}
        >
          <Plug className="size-[18px] shrink-0" />
          <span className="flex-1 text-left">Plugins</span>
          {connectedCount > 0 && (
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {connectedCount}
            </span>
          )}
        </Link>

        <AgentChatHistoryList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename}
        />
      </aside>

      <AgentChatSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        onSelect={onSelect}
        onCreate={onCreate}
      />
    </>
  );
}
