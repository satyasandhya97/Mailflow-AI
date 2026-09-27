"use client";

import { useEffect, useState } from "react";

import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const WINDOW_MS = 15 * 60_000;

type TaskCountdownBarProps = {
  nextRunAt: Date;
  className?: string;
};

/** Thin progress bar that depletes as the scheduled run time approaches. */
export function TaskCountdownBar({ nextRunAt, className }: TaskCountdownBarProps) {
  const [percent, setPercent] = useState(100);

  useEffect(() => {
    const target = nextRunAt.getTime();
    const start = target - WINDOW_MS;

    const tick = () => {
      const now = Date.now();
      if (now >= target) {
        setPercent(0);
        return;
      }
      const range = target - start;
      const remaining = target - now;
      setPercent(Math.max(0, Math.min(100, (remaining / range) * 100)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRunAt]);

  const isSoon = percent <= 35;

  return (
    <Progress
      value={percent}
      className={cn("gap-0", className)}
      aria-label="Time until next run"
    >
      <ProgressTrack className="h-1 overflow-hidden bg-primary/10">
        <ProgressIndicator
          className={cn(
            "transition-all duration-1000 ease-linear",
            isSoon ? "bg-amber-500" : "bg-primary/60",
          )}
        />
      </ProgressTrack>
    </Progress>
  );
}
