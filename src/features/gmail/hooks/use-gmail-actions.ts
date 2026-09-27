"use client";

import { api } from "@/trpc/react";

export function useGmailActions() {
  const utils = api.useUtils();

  const invalidateInboxLists = async () => {
    await Promise.all([
      utils.gmail.searchEmails.invalidate(),
      utils.gmail.listSent.invalidate(),
      utils.gmail.listStarred.invalidate(),
      utils.gmail.listByLabel.invalidate(),
    ]);
  };

  const invalidateMessageViews = async () => {
    await Promise.all([
      utils.gmail.getMessage.invalidate(),
      utils.gmail.getThread.invalidate(),
      utils.gmail.getMessageWithThread.invalidate(),
    ]);
  };

  const modifyMessages = api.gmail.modifyMessages.useMutation({
    onSuccess: async (_data, variables) => {
      await invalidateInboxLists();
      await invalidateMessageViews();

      const touchesStar =
        variables.addLabelIds?.includes("STARRED") === true ||
        variables.removeLabelIds?.includes("STARRED") === true;
      if (touchesStar) {
        await utils.gmail.listStarred.invalidate();
      }
    },
  });

  const archiveMessages = api.gmail.archiveMessages.useMutation({
    onSuccess: async () => {
      await invalidateInboxLists();
      await invalidateMessageViews();
    },
  });

  const trashMessages = api.gmail.trashMessages.useMutation({
    onSuccess: async () => {
      await invalidateInboxLists();
      await invalidateMessageViews();
    },
  });

  const deleteDraft = api.gmail.deleteDraft.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.gmail.listDrafts.invalidate(),
        utils.gmail.getDraftCount.invalidate(),
        utils.gmail.getDraft.invalidate({ id: variables.id }),
      ]);
    },
  });

  const toggleStar = (id: string, starred: boolean) => {
    modifyMessages.mutate({
      ids: [id],
      addLabelIds: starred ? ["STARRED"] : undefined,
      removeLabelIds: starred ? undefined : ["STARRED"],
    });
  };

  const markRead = (ids: string[]) => {
    modifyMessages.mutate({
      ids,
      removeLabelIds: ["UNREAD"],
    });
  };

  const markUnread = (ids: string[]) => {
    modifyMessages.mutate({
      ids,
      addLabelIds: ["UNREAD"],
    });
  };

  return {
    modifyMessages,
    archiveMessages,
    trashMessages,
    deleteDraft,
    toggleStar,
    markRead,
    markUnread,
    isPending:
      modifyMessages.isPending ||
      archiveMessages.isPending ||
      trashMessages.isPending,
  };
}
