"use client";

import {
  Archive,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  MoreVertical,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type GmailMessageToolbarProps = {
  allSelected: boolean;
  onToggleAll: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasSelection?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkUnread?: () => void;
  actionsPending?: boolean;
  hideArchive?: boolean;
  hideMarkUnread?: boolean;
};

export function GmailMessageToolbar({
  allSelected,
  onToggleAll,
  onRefresh,
  isRefreshing,
  rangeStart,
  rangeEnd,
  total,
  page,
  totalPages,
  onPageChange,
  hasSelection = false,
  onArchive,
  onDelete,
  onMarkUnread,
  actionsPending = false,
  hideArchive = false,
  hideMarkUnread = false,
}: GmailMessageToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border/60 bg-[var(--cream-lifted)] px-3 py-2">
      <Checkbox
        checked={allSelected}
        onCheckedChange={onToggleAll}
        aria-label="Select all"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh"
      >
        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Archive"
        onClick={onArchive}
        disabled={!hasSelection || actionsPending}
        className={hideArchive ? "hidden" : undefined}
      >
        <Archive className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        onClick={onDelete}
        disabled={!hasSelection || actionsPending}
      >
        <Trash2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Mark unread"
        onClick={onMarkUnread}
        disabled={!hasSelection || actionsPending}
        className={hideMarkUnread ? "hidden" : undefined}
      >
        <MailOpen className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="More" disabled>
        <MoreVertical className="size-4" />
      </Button>

      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {rangeStart}–{rangeEnd} of {total}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
