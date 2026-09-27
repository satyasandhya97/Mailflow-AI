import { GmailMessageListSkeleton } from "@/features/gmail/components/skeletons/gmail-message-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function GmailShellConnectionSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-4 rounded-xl border border-border/60 bg-cream-lifted p-4"
      role="status"
      aria-busy="true"
      aria-label="Checking Gmail connection"
    >
      <Skeleton className="h-12 w-full max-w-md rounded-full" />
      <GmailMessageListSkeleton rows={6} />
    </div>
  );
}

export function GmailShellFallback() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 p-4"
      role="status"
      aria-busy="true"
      aria-label="Loading Gmail"
    >
      <Skeleton className="h-12 w-full max-w-md rounded-full" />
      <GmailMessageListSkeleton rows={8} />
    </div>
  );
}
