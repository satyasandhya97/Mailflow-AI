"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { AgentShellSidebar } from "@/features/agent/components/agent-shell-sidebar";
import { AgentShellLayoutSkeleton } from "@/features/agent/components/skeletons";
import { Button } from "@/components/ui/button";
import { useAgentConversationsContext } from "@/features/agent/context/agent-conversations-provider";

export function AgentShellLayout({ children }: { children: React.ReactNode }) {
  const {
    conversations,
    activeId,
    isHydrated,
    loadError,
    retryLoad,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useAgentConversationsContext();

  if (!isHydrated) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AgentShellLayoutSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <div className="max-w-md space-y-2">
            <p className="text-sm font-medium">Could not load agent chats</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <p className="text-xs text-muted-foreground">
              If this is a fresh setup, run{" "}
              <code className="rounded bg-muted px-1 py-0.5">pnpm db:migrate</code>{" "}
              and refresh.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={retryLoad}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-4 pb-4">
        <AgentShellSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onCreate={() => {
            void createConversation();
          }}
          onDelete={(id) => {
            void deleteConversation(id);
          }}
          onRename={(id, title) => {
            void renameConversation(id, title);
          }}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
