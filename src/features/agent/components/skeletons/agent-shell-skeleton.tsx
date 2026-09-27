import { AgentChatSkeleton } from "@/features/agent/components/skeletons/agent-chat-skeleton";
import { AgentSidebarSkeleton } from "@/features/agent/components/skeletons/agent-sidebar-skeleton";

export function AgentShellLayoutSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-4 pb-4">
      <AgentSidebarSkeleton />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AgentChatSkeleton />
      </main>
    </div>
  );
}
