"use client";

import { Paperclip, Star } from "lucide-react";
import { useRouter } from "next/navigation";

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
import {
  formatInboxListDate,
  getSenderDisplayName,
} from "@/features/gmail/lib/gmail-ui.utils";
import { gmailMessageHref } from "@/features/gmail/lib/gmail-routes";
import type { EmailListItem } from "@/features/gmail/types";
import { api } from "@/trpc/react";

type GmailMessageRowsProps = {
  emails: EmailListItem[];
  emptyMessage?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export function GmailMessageRows({
  emails,
  emptyMessage = "No emails in this tab.",
  onRefresh,
  isRefreshing = false,
}: GmailMessageRowsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const {
    starredIds,
    readIds,
    selectedIds,
    toggleStar,
    markRead,
    toggleSelected,
  } = useGmail();

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
        <p>{emptyMessage}</p>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          Refresh from Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden [&_[data-slot=table-container]]:overflow-x-hidden">
      <Table className="table-fixed w-full">
      <TableBody>
        {emails.map((email) => {
          const sender = getSenderDisplayName(email.from);
          const isUnread = !readIds.has(email.id);
          const isStarred =
            starredIds.has(email.id) || email.isStarred === true;
          const isSelected = selectedIds.has(email.id);
          const hasAttachment =
            email.snippet.toLowerCase().includes("attach") ||
            email.subject.toLowerCase().includes(".pdf");

          return (
            <TableRow
              key={email.id}
              data-state={isSelected ? "selected" : undefined}
              className={cn(
                "cursor-pointer border-border/50 hover:bg-muted/40 ",
                isSelected && "bg-[var(--teal-100)]/60",
              )}
              onClick={() => {
                markRead(email.id);
                router.push(gmailMessageHref(email.id));
              }}
              onMouseEnter={() => {
                void utils.gmail.getMessageWithThread.prefetch({ id: email.id });
              }}
            >
              <TableCell
                className="w-10 py-0 px-3 "
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelected(email.id)}
                  aria-label={`Select ${sender}`}
                />
              </TableCell>
              <TableCell
                className="w-10 py-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded p-1 hover:bg-muted"
                  onClick={() => toggleStar(email.id, isStarred)}
                  aria-label={isStarred ? "Unstar" : "Star"}
                >
                  <Star
                    className={cn(
                      "size-4",
                      isStarred
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/50",
                    )}
                  />
                </Button>
              </TableCell>
              <TableCell className="max-w-0 overflow-hidden py-3 whitespace-normal">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "w-[140px] shrink-0 truncate text-sm",
                      isUnread ? "font-semibold" : "font-normal",
                    )}
                  >
                    {sender}
                  </span>
                  <span className="min-w-0 truncate text-sm">
                    <span className={isUnread ? "font-semibold" : ""}>
                      {email.subject || "(no subject)"}
                    </span>
                    {email.snippet && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        — {email.snippet}
                      </span>
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-28 py-0 text-right px-6 ">
                <div className="flex items-center justify-end gap-2">
                  {hasAttachment && (
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatInboxListDate(email.date)}
                  </span>
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
