import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SUBJECT_WIDTHS = ["w-[55%]", "w-[72%]", "w-[63%]", "w-[80%]", "w-[58%]"];

type GmailMessageRowSkeletonProps = {
  index?: number;
};

export function GmailMessageRowSkeleton({
  index = 0,
}: GmailMessageRowSkeletonProps) {
  const subjectWidth = SUBJECT_WIDTHS[index % SUBJECT_WIDTHS.length];

  return (
    <div className="flex items-center gap-2 border-b border-border/40 px-3 py-3">
      <Skeleton className="size-4 shrink-0 rounded-sm" />
      <Skeleton className="size-4 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-[140px] shrink-0" />
      <Skeleton className={cn("h-4 min-w-0 flex-1", subjectWidth)} />
      <Skeleton className="h-3 w-16 shrink-0" />
    </div>
  );
}
