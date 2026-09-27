"use client";

import { api } from "@/trpc/react";
import { GmailFolderMessageList } from "@/features/gmail/components/gmail-folder-message-list";
import { GMAIL_LIST_STALE_MS } from "@/features/gmail/lib/gmail-query-options";

type GmailLabelViewProps = {
  labelId: string;
};

export function GmailLabelView({ labelId }: GmailLabelViewProps) {
  const utils = api.useUtils();
  const emails = api.gmail.listByLabel.useQuery(
    { labelId, limit: 50, offset: 0 },
    { staleTime: GMAIL_LIST_STALE_MS },
  );
  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async () => {
      await utils.gmail.listByLabel.invalidate();
    },
  });

  return (
    <GmailFolderMessageList
      emails={emails.data}
      isLoading={emails.isLoading}
      error={emails.error}
      emptyMessage="No messages with this label."
      onRefresh={() => refreshInbox.mutate()}
      isRefreshing={refreshInbox.isPending}
    />
  );
}
