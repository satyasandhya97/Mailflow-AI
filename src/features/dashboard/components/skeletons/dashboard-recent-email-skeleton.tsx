import { Skeleton } from "@/components/ui/skeleton";

export function DashboardRecentEmailSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="-mx-2"
      role="status"
      aria-busy="true"
      aria-label="Loading email"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-3 max-w-[70%]" />
          </div>
        </div>
      ))}
    </div>
  );
}
