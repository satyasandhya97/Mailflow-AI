import { Skeleton } from "@/components/ui/skeleton";

export function DashboardAgendaSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      className="-mx-2"
      role="status"
      aria-busy="true"
      aria-label="Loading schedule"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
          <Skeleton className="h-9 w-16 shrink-0 rounded-md" />
          <Skeleton className="h-4 max-w-[55%] flex-1" />
        </div>
      ))}
    </div>
  );
}
