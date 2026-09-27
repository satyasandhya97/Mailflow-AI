import {
  AgentChatHeaderSkeleton,
  AgentComposerSkeleton,
  AgentMessageSkeleton,
  AgentSkeletonSurface,
} from "@/features/agent/components/skeletons/agent-skeleton-primitives";

export function AgentChatSkeleton() {
  return (
    <AgentSkeletonSurface aria-label="Loading chat">
      <AgentChatHeaderSkeleton />
      <div className="mx-auto flex min-h-0 flex-1 w-full max-w-3xl flex-col gap-6 overflow-hidden px-4 pb-4">
        <AgentMessageSkeleton align="right" />
        <AgentMessageSkeleton align="left" />
        <AgentMessageSkeleton align="right" />
      </div>
      <AgentComposerSkeleton />
    </AgentSkeletonSurface>
  );
}
