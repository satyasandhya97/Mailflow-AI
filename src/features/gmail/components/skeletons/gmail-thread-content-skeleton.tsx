import { Skeleton } from "@/components/ui/skeleton";

/** Scroll-area skeleton for thread view (toolbar is rendered separately). */
export function GmailThreadContentSkeleton() {
  return (
    <div
      className="space-y-4 px-6 py-5"
      role="status"
      aria-busy="true"
      aria-label="Loading thread"
    >
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
  );
}
