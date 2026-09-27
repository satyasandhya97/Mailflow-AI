"use client";

import { useMemo, useState } from "react";

import { GmailMessageListSkeleton } from "@/features/gmail/components/skeletons";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import { GmailMessageRows } from "@/features/gmail/components/gmail-message-rows";
import { GmailMessageToolbar } from "@/features/gmail/components/gmail-message-toolbar";
import { api } from "@/trpc/react";
import type { EmailListItem } from "@/features/gmail/types";

const PAGE_SIZE = 25;

type GmailFolderMessageListProps = {
  emails: EmailListItem[] | undefined;
  isLoading: boolean;
  error: { message: string } | null;
  emptyMessage: string;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function GmailFolderMessageList({
  emails,
  isLoading,
  error,
  emptyMessage,
  onRefresh,
  isRefreshing,
}: GmailFolderMessageListProps) {
  const { setSelectedIds, selectedIds, archiveSelected, trashSelected, markSelectedUnread, actionsPending } = useGmail();
  const [page, setPage] = useState(0);

  const allEmails = emails ?? [];

  const totalPages = Math.max(1, Math.ceil(allEmails.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageEmails = useMemo(
    () =>
      allEmails.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [allEmails, safePage],
  );

  const allPageSelected =
    pageEmails.length > 0 && pageEmails.every((e) => selectedIds.has(e.id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      for (const e of pageEmails) next.delete(e.id);
    } else {
      for (const e of pageEmails) next.add(e.id);
    }
    setSelectedIds(next);
  };

  const rangeStart = allEmails.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, allEmails.length);

  if (isLoading) {
    return <GmailMessageListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col  overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)] ">
      <GmailMessageToolbar
        allSelected={allPageSelected}
        onToggleAll={toggleAll}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={allEmails.length}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        hasSelection={selectedIds.size > 0}
        onArchive={archiveSelected}
        onDelete={trashSelected}
        onMarkUnread={markSelectedUnread}
        actionsPending={actionsPending}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <GmailMessageRows
          emails={pageEmails}
          emptyMessage={emptyMessage}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
}
