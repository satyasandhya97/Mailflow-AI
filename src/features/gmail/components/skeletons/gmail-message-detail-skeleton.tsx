import { Skeleton } from "@/components/ui/skeleton";

export function GmailMessageDetailSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-cream-lifted"
      role="status"
      aria-busy="true"
      aria-label="Loading message"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="size-8 rounded-md" />
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-6 py-5">
        <Skeleton className="h-8 w-2/3" />

        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
