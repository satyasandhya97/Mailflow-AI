"use client";

import { GmailDraftsView } from "@/features/gmail/components/gmail-drafts-view";
import { useInbox } from "@/features/gmail/hooks/use-inbox";

export default function GmailDraftsRoutePage() {
  const inbox = useInbox({
    activeSearch: "",
    view: "drafts",
    selectedId: null,
  });

  return (
    <GmailDraftsView
      drafts={inbox.drafts.data}
      isLoading={inbox.drafts.isLoading}
      error={inbox.drafts.error}
      onRefresh={() => inbox.refreshDrafts.mutate()}
      isRefreshing={inbox.refreshDrafts.isPending}
    />
  );
}
