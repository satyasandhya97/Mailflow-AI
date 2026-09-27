import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AgentSkeletonSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function AgentSkeletonSurface({
  children,
  className,
  "aria-label": ariaLabel = "Loading agent",
}: AgentSkeletonSurfaceProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)]",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function AgentChatHeaderSkeleton() {
  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="size-7 rounded-md" />
    </div>
  );
}

export function AgentMessageSkeleton({ align }: { align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex w-full max-w-3xl",
        align === "right" ? "ml-auto justify-end" : "mr-auto justify-start",
      )}
    >
      <Skeleton
        className={cn(
          "h-16 rounded-2xl",
          align === "right" ? "w-[55%]" : "w-[70%]",
        )}
      />
    </div>
  );
}

export function AgentComposerSkeleton() {
  return (
    <div className="shrink-0 px-4 pb-5 pt-2">
      <div className="mx-auto w-full max-w-3xl rounded-[1.25rem] border border-border/50 bg-background shadow-sm">
        <Skeleton className="mx-4 mt-4 h-16 rounded-lg" />
        <div className="flex items-center justify-between px-3 py-2">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
