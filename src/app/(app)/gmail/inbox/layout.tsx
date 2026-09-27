import { Suspense } from "react";

import { GmailMessageListSkeleton } from "@/features/gmail/components/skeletons";
import { GmailInboxDataProvider } from "@/features/gmail/context/gmail-inbox-data-provider";

export default function GmailInboxRouteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<GmailMessageListSkeleton rows={8} />}>
      <GmailInboxDataProvider>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </GmailInboxDataProvider>
    </Suspense>
  );
}
