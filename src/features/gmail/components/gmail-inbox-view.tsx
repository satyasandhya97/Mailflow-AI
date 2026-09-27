"use client";

import { useMemo, useState } from "react";

import { GmailMessageListSkeleton } from "@/features/gmail/components/skeletons";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import { useGmailInboxData } from "@/features/gmail/context/gmail-inbox-data-provider";
import { GmailMessageRows } from "@/features/gmail/components/gmail-message-rows";
import { GmailMessageToolbar } from "@/features/gmail/components/gmail-message-toolbar";

const PAGE_SIZE = 25;

export function GmailInboxView() {
  const inbox = useGmailInboxData();
  const {
    setSelectedIds,
    selectedIds,
    archiveSelected,
    trashSelected,
    markSelectedUnread,
    actionsPending,
  } = useGmail();
  const [page, setPage] = useState(0);

  const emails = inbox.emails.data ?? [];

  const totalPages = Math.max(1, Math.ceil(emails.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageEmails = useMemo(
    () => emails.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [emails, safePage],
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

  const rangeStart = emails.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, emails.length);

  if (inbox.emails.isLoading) {
    return <GmailMessageListSkeleton />;
  }

  if (inbox.emails.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {inbox.emails.error.message}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)]">
      <GmailMessageToolbar
        allSelected={allPageSelected}
        onToggleAll={toggleAll}
        onRefresh={() => inbox.refreshInbox.mutate()}
        isRefreshing={inbox.refreshInbox.isPending}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={emails.length}
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
          onRefresh={() => inbox.refreshInbox.mutate()}
          isRefreshing={inbox.refreshInbox.isPending}
        />
      </div>
    </div>
  );
}
