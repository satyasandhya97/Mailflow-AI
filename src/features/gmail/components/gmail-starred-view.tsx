"use client";

import { api } from "@/trpc/react";
import { GmailFolderMessageList } from "@/features/gmail/components/gmail-folder-message-list";
import { GMAIL_LIST_STALE_MS } from "@/features/gmail/lib/gmail-query-options";

export function GmailStarredView() {
  const utils = api.useUtils();
  const starred = api.gmail.listStarred.useQuery(
    { limit: 50, offset: 0 },
    { staleTime: GMAIL_LIST_STALE_MS },
  );
  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async () => {
      await utils.gmail.listStarred.invalidate();
    },
  });

  return (
    <GmailFolderMessageList
      emails={starred.data}
      isLoading={starred.isLoading}
      error={starred.error}
      emptyMessage="No starred messages yet."
      onRefresh={() => refreshInbox.mutate()}
      isRefreshing={refreshInbox.isPending}
    />
  );
}
