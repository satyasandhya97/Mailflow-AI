"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { GmailMessageDetailSkeleton } from "@/features/gmail/components/skeletons";
import { GmailThreadView } from "@/features/gmail/components/gmail-thread-view";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import { useGmailActions } from "@/features/gmail/hooks/use-gmail-actions";
import { GMAIL_MESSAGE_STALE_MS } from "@/features/gmail/lib/gmail-query-options";
import { gmailInboxHref } from "@/features/gmail/lib/gmail-routes";
import { api } from "@/trpc/react";

type GmailMessagePageProps = {
  messageId: string;
};

export function GmailMessagePage({ messageId }: GmailMessagePageProps) {
  const router = useRouter();
  const { openComposeReply, openComposeForward, markRead } = useGmail();
  const actions = useGmailActions();

  const data = api.gmail.getMessageWithThread.useQuery(
    { id: messageId },
    { staleTime: GMAIL_MESSAGE_STALE_MS },
  );

  useEffect(() => {
    if (data.data?.message) {
      markRead(messageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId, data.data?.message.id]);

  const handleArchive = () => {
    const ids =
      data.data?.thread.messages.map((message) => message.id) ?? [messageId];
    actions.archiveMessages.mutate(
      { ids },
      { onSuccess: () => router.push(gmailInboxHref()) },
    );
  };

  const handleDelete = () => {
    const ids =
      data.data?.thread.messages.map((message) => message.id) ?? [messageId];
    actions.trashMessages.mutate(
      { ids },
      { onSuccess: () => router.push(gmailInboxHref()) },
    );
  };

  if (data.isLoading) {
    return <GmailMessageDetailSkeleton />;
  }

  return (
    <GmailThreadView
      subject={data.data?.thread.subject ?? ""}
      messages={data.data?.thread.messages ?? []}
      highlightMessageId={messageId}
      isLoading={false}
      error={data.error}
      onBack={() => router.back()}
      onReply={openComposeReply}
      onForward={openComposeForward}
      onArchive={handleArchive}
      onDelete={handleDelete}
      actionsPending={actions.isPending}
    />
  );
}
