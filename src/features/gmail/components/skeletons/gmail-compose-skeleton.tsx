import { Skeleton } from "@/components/ui/skeleton";

export function GmailComposeSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      role="status"
      aria-busy="true"
      aria-label="Loading draft"
    >
      <Skeleton className="h-10 w-full rounded-none border-b border-border/60" />
      <Skeleton className="h-10 w-full rounded-none border-b border-border/60" />
      <Skeleton className="min-h-[220px] flex-1 rounded-none" />
      <div className="flex shrink-0 border-t border-border/60 px-3 py-2">
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}
