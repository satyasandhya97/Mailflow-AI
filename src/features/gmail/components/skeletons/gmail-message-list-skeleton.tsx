import { GmailMessageRowSkeleton } from "@/features/gmail/components/skeletons/gmail-message-row-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

type GmailMessageListSkeletonProps = {
  rows?: number;
};

export function GmailMessageListSkeleton({
  rows = 10,
}: GmailMessageListSkeletonProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-cream-lifted"
      role="status"
      aria-busy="true"
      aria-label="Loading messages"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-3 py-2">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-28" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <GmailMessageRowSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
