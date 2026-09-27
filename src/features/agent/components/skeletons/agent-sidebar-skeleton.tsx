import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AgentSidebarSkeleton({ className }: { className?: string }) {
  return (
    <aside
      className={cn("flex w-[220px] shrink-0 flex-col gap-4 pr-2", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading agent sidebar"
    >
      <div className="flex items-center gap-2 px-1">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="flex min-h-0 flex-1 flex-col gap-2 pt-1">
        <Skeleton className="h-3 w-20 px-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    </aside>
  );
}
