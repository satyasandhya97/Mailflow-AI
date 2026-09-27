"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import { useGmailActions } from "@/features/gmail/hooks/use-gmail-actions";
import { formatInboxListDate } from "@/features/gmail/lib/gmail-ui.utils";
import type { DraftItem } from "@/features/gmail/types";

type GmailDraftRowsProps = {
  drafts: DraftItem[];
  emptyMessage?: string;
};

export function GmailDraftRows({
  drafts,
  emptyMessage = "No drafts yet.",
}: GmailDraftRowsProps) {
  const { openComposeDraft, selectedIds, toggleSelected } = useGmail();
  const actions = useGmailActions();

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden [&_[data-slot=table-container]]:overflow-x-hidden">
      <Table className="table-fixed w-full">
        <TableBody>
          {drafts.map((draft) => {
            const recipient = draft.to?.trim() || "No recipient";
            const isSelected = selectedIds.has(draft.id);

            return (
              <TableRow
                key={draft.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(
                  "group cursor-pointer border-border/50 hover:bg-muted/40",
                  isSelected && "bg-[var(--teal-100)]/60",
                )}
                onClick={() => openComposeDraft(draft.id)}
              >
                <TableCell
                  className="w-10 px-3 py-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelected(draft.id)}
                    aria-label={`Select draft ${draft.subject}`}
                  />
                </TableCell>
                <TableCell className="w-10 py-0" />
                <TableCell className="max-w-0 overflow-hidden py-3 whitespace-normal">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-[140px] shrink-0 truncate text-sm font-semibold">
                      {recipient}
                    </span>
                    <span className="min-w-0 truncate text-sm">
                      <span className="font-semibold">
                        {draft.subject || "(no subject)"}
                      </span>
                      {draft.snippet && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          — {draft.snippet}
                        </span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="w-28 px-6 py-0 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {draft.createdAt && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatInboxListDate(draft.createdAt)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete draft"
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.deleteDraft.mutate({ id: draft.id });
                      }}
                      disabled={actions.deleteDraft.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
