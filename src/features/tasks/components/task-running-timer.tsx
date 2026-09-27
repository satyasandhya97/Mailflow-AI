"use client";

import { useEffect, useState } from "react";

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

type TaskRunningTimerProps = {
  /** When the task entered in_progress (typically updatedAt). */
  startedAt: Date | null;
  className?: string;
};

/** Live elapsed timer shown while an agent task is running. */
export function TaskRunningTimer({ startedAt, className }: TaskRunningTimerProps) {
  const [elapsed, setElapsed] = useState("0s");

  useEffect(() => {
    if (!startedAt) return;

    const tick = () => {
      setElapsed(formatElapsed(Date.now() - startedAt.getTime()));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <span className={className} suppressHydrationWarning>
      {elapsed}
    </span>
  );
}
