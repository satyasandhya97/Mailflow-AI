"use client";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calendarUi } from "@/features/calendar/lib/calendar-theme";

type CalendarGridToolbarProps = {
  weekLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNewEvent: () => void;
};

export function CalendarGridToolbar({
  weekLabel,
  onPrevious,
  onNext,
  onToday,
  onRefresh,
  isRefreshing,
  onNewEvent,
}: CalendarGridToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-[var(--cream-lifted)] px-4 py-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-border/60 bg-background hover:bg-[var(--brand-tint)]"
          onClick={onToday}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onPrevious}
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNext}
          aria-label="Next week"
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-1 text-sm font-semibold tracking-tight tabular-nums text-[var(--teal-900)]">
          {weekLabel}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
          className="hidden sm:inline-flex"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </Button>

        <Button size="sm" className={calendarUi.primaryButton} onClick={onNewEvent}>
          <Plus className="size-4" />
          New event
        </Button>
      </div>
    </div>
  );
}
