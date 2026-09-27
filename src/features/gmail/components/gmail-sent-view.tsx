"use client";

import { api } from "@/trpc/react";
import { GmailFolderMessageList } from "@/features/gmail/components/gmail-folder-message-list";
import { GMAIL_LIST_STALE_MS } from "@/features/gmail/lib/gmail-query-options";

export function GmailSentView() {
  const utils = api.useUtils();
  const sent = api.gmail.listSent.useQuery(
    { limit: 50, offset: 0 },
    { staleTime: GMAIL_LIST_STALE_MS },
  );
  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async () => {
      await utils.gmail.listSent.invalidate();
    },
  });

  return (
    <GmailFolderMessageList
      emails={sent.data}
      isLoading={sent.isLoading}
      error={sent.error}
      emptyMessage="No sent messages yet."
      onRefresh={() => refreshInbox.mutate()}
      isRefreshing={refreshInbox.isPending}
    />
  );
}
