"use client";

import {
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  Printer,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GmailMessageDetailToolbarProps = {
  onBack: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  isStarred: boolean;
  threadIndex: number;
  threadTotal: number;
  onPrev?: () => void;
  onNext?: () => void;
  actionsPending?: boolean;
};

export function GmailMessageDetailToolbar({
  onBack,
  onArchive,
  onDelete,
  onToggleStar,
  isStarred,
  threadIndex,
  threadTotal,
  onPrev,
  onNext,
  actionsPending = false,
}: GmailMessageDetailToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b border-border/60 bg-[var(--cream-lifted)] px-2 py-1.5">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back">
        <ArrowLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Archive"
        onClick={onArchive}
        disabled={actionsPending}
      >
        <Archive className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        onClick={onDelete}
        disabled={actionsPending}
      >
        <Trash2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isStarred ? "Unstar" : "Star"}
        onClick={onToggleStar}
        disabled={actionsPending}
      >
        <Star
          className={cn(
            "size-4",
            isStarred ? "fill-amber-400 text-amber-400" : undefined,
          )}
        />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Snooze" disabled>
        <Clock className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="More" disabled>
        <MoreVertical className="size-4" />
      </Button>

      <div className="ml-auto flex items-center gap-0.5 text-xs text-muted-foreground">
        <span className="hidden tabular-nums sm:inline">
          {threadIndex} of {threadTotal}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous message"
          disabled={!onPrev}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next message"
          disabled={!onNext}
          onClick={onNext}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Print" disabled>
          <Printer className="size-4" />
        </Button>
      </div>
    </div>
  );
}
