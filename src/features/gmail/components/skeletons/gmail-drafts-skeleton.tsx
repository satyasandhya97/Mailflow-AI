import { Skeleton } from "@/components/ui/skeleton";

type GmailDraftsSkeletonProps = {
  rows?: number;
};

export function GmailDraftsSkeleton({ rows = 4 }: GmailDraftsSkeletonProps) {
  return (
    <div
      className="space-y-0 divide-y divide-border/50 p-2"
      role="status"
      aria-busy="true"
      aria-label="Loading drafts"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[45%]" />
            <Skeleton className="h-3 w-[70%]" />
          </div>
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <Skeleton className="h-8 w-14 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}
