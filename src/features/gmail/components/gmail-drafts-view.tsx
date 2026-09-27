"use client";

import { useMemo, useState } from "react";

import { GmailDraftRows } from "@/features/gmail/components/gmail-draft-rows";
import { GmailMessageToolbar } from "@/features/gmail/components/gmail-message-toolbar";
import { GmailMessageListSkeleton } from "@/features/gmail/components/skeletons";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import { useGmailActions } from "@/features/gmail/hooks/use-gmail-actions";
import type { DraftItem } from "@/features/gmail/types";

const PAGE_SIZE = 25;

type GmailDraftsViewProps = {
  drafts: DraftItem[] | undefined;
  isLoading: boolean;
  error: { message: string } | null;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function GmailDraftsView({
  drafts,
  isLoading,
  error,
  onRefresh,
  isRefreshing,
}: GmailDraftsViewProps) {
  const {
    setSelectedIds,
    selectedIds,
    actionsPending,
  } = useGmail();
  const actions = useGmailActions();
  const [page, setPage] = useState(0);

  const allDrafts = drafts ?? [];

  const totalPages = Math.max(1, Math.ceil(allDrafts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageDrafts = useMemo(
    () =>
      allDrafts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [allDrafts, safePage],
  );

  const allPageSelected =
    pageDrafts.length > 0 && pageDrafts.every((d) => selectedIds.has(d.id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      for (const draft of pageDrafts) next.delete(draft.id);
    } else {
      for (const draft of pageDrafts) next.add(draft.id);
    }
    setSelectedIds(next);
  };

  const deleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    void Promise.all(
      ids.map((id) => actions.deleteDraft.mutateAsync({ id })),
    ).then(() => setSelectedIds(new Set()));
  };

  const rangeStart = allDrafts.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, allDrafts.length);

  if (isLoading) {
    return <GmailMessageListSkeleton rows={8} />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)]">
      <GmailMessageToolbar
        allSelected={allPageSelected}
        onToggleAll={toggleAll}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={allDrafts.length}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        hasSelection={selectedIds.size > 0}
        onDelete={deleteSelected}
        actionsPending={actionsPending || actions.deleteDraft.isPending}
        hideArchive
        hideMarkUnread
      />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <GmailDraftRows drafts={pageDrafts} />
      </div>
    </div>
  );
}
