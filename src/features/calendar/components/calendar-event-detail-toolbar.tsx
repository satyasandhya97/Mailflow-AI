"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type CalendarEventDetailToolbarProps = {
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  htmlLink?: string;
  eventIndex: number;
  eventTotal: number;
  onPrev?: () => void;
  onNext?: () => void;
  actionsPending?: boolean;
};

export function CalendarEventDetailToolbar({
  onBack,
  onEdit,
  onDelete,
  htmlLink,
  eventIndex,
  eventTotal,
  onPrev,
  onNext,
  actionsPending = false,
}: CalendarEventDetailToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b border-border/60 bg-[var(--cream-lifted)] px-2 py-1.5">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back">
        <ArrowLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit"
        onClick={onEdit}
        disabled={actionsPending}
      >
        <Pencil className="size-4" />
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
      {htmlLink && (
        <a
          href={htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in Google Calendar"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <ExternalLink className="size-4" />
        </a>
      )}

      <div className="ml-auto flex items-center gap-0.5 text-xs text-muted-foreground">
        <span className="hidden tabular-nums sm:inline">
          {eventIndex} of {eventTotal}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous event"
          disabled={!onPrev}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next event"
          disabled={!onNext}
          onClick={onNext}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
