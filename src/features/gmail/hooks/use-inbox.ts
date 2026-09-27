import { api } from "@/trpc/react";
import { GMAIL_LIST_STALE_MS } from "@/features/gmail/lib/gmail-query-options";

export function useInbox(options: {
  activeSearch: string;
  view: "inbox" | "drafts";
  selectedId: string | null;
}) {
  const utils = api.useUtils();

  const emails = api.gmail.searchEmails.useQuery(
    { query: options.activeSearch, limit: 50, offset: 0 },
    {
      enabled: options.view === "inbox",
      staleTime: GMAIL_LIST_STALE_MS,
    },
  );

  const selectedEmail = api.gmail.getMessage.useQuery(
    { id: options.selectedId! },
    { enabled: !!options.selectedId },
  );

  const drafts = api.gmail.listDrafts.useQuery(
    { limit: 50, offset: 0 },
    {
      enabled: options.view === "drafts",
      staleTime: GMAIL_LIST_STALE_MS,
    },
  );

  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async () => {
      await utils.gmail.searchEmails.invalidate();
      await utils.gmail.listSent.invalidate();
      await utils.gmail.listStarred.invalidate();
      await utils.gmail.listDrafts.invalidate();
      await utils.gmail.getDraftCount.invalidate();
      await utils.gmail.listLabels.invalidate();
      await utils.gmail.listByLabel.invalidate();
    },
  });

  const refreshDrafts = api.gmail.refreshDrafts.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.gmail.listDrafts.invalidate(),
        utils.gmail.getDraftCount.invalidate(),
      ]);
    },
  });

  const sendDraft = api.gmail.sendDraft.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.gmail.searchEmails.invalidate(),
        utils.gmail.listSent.invalidate(),
        utils.gmail.listDrafts.invalidate(),
        utils.gmail.getDraftCount.invalidate(),
        utils.gmail.getDraft.invalidate({ id: variables.draftId }),
      ]);
    },
  });

  return {
    emails,
    selectedEmail,
    drafts,
    refreshInbox,
    refreshDrafts,
    sendDraft,
  };
}
