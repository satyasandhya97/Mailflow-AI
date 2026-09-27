"use client";

import { useEffect, useState } from "react";

import { formatCountdownRemaining } from "@/features/tasks/lib/task-schedule";

type TaskCountdownTimerProps = {
  nextRunAt: Date | null;
  className?: string;
  /** Called once when the countdown reaches zero. */
  onDue?: () => void;
};

/** Live countdown until the next scheduled agent run. */
export function TaskCountdownTimer({
  nextRunAt,
  className,
  onDue,
}: TaskCountdownTimerProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!nextRunAt) return;

    const targetMs = nextRunAt.getTime();
    let firedDue = false;

    const tick = () => {
      const now = Date.now();
      const remaining = targetMs - now;

      if (remaining <= 0) {
        setLabel("due now");
        if (!firedDue) {
          firedDue = true;
          onDue?.();
        }
        return;
      }

      setLabel(formatCountdownRemaining(remaining));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRunAt, onDue]);

  if (!nextRunAt || !label) return null;

  const isDue = label === "due now";
  const isSoon =
    !isDue && nextRunAt.getTime() - Date.now() <= 5 * 60_000;

  return (
    <span
      className={className}
      data-due={isDue || undefined}
      data-soon={isSoon || undefined}
      suppressHydrationWarning
    >
      {isDue ? "due now" : `in ${label}`}
    </span>
  );
}
