import { addDays, format } from "date-fns";

import type { TaskScheduleType } from "@/features/tasks/types/task.types";

export const DEFAULT_TASK_TIMEZONE = "Asia/Kolkata";

function parseScheduleTime(time: string | null | undefined): {
  hours: number;
  minutes: number;
} {
  const [hoursRaw, minutesRaw] = (time ?? "09:00").split(":").map((part) => Number(part));
  const hours = typeof hoursRaw === "number" && Number.isFinite(hoursRaw) ? hoursRaw : 9;
  const minutes =
    typeof minutesRaw === "number" && Number.isFinite(minutesRaw) ? minutesRaw : 0;
  return { hours, minutes };
}

function getTimezoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

export function zonedLocalToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const { hours, minutes } = parseScheduleTime(timeStr);

  let guess = Date.UTC(year!, month! - 1, day!, hours, minutes, 0);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getTimezoneOffsetMs(new Date(guess), timeZone);
    guess = Date.UTC(year!, month! - 1, day!, hours, minutes, 0) - offset;
  }

  return new Date(guess);
}

function getZonedWeekday(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? 0;
}

export function computeNextRunAt(input: {
  scheduleType: TaskScheduleType;
  scheduledAt?: Date | null;
  scheduleTime?: string | null;
  scheduleDay?: number | null;
  timezone?: string;
  after?: Date;
}): Date | null {
  const after = input.after ?? new Date();
  const timeZone = input.timezone ?? DEFAULT_TASK_TIMEZONE;

  if (input.scheduleType === "once") {
    if (!input.scheduledAt) return null;
    // Past or immediate times run ASAP (within ~2s) instead of never scheduling.
    if (input.scheduledAt <= after) {
      return new Date(after.getTime() + 2_000);
    }
    return input.scheduledAt;
  }

  const { hours, minutes } = parseScheduleTime(input.scheduleTime);
  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  for (let offset = 0; offset < 14; offset += 1) {
    const day = addDays(after, offset);
    const dateStr = format(day, "yyyy-MM-dd");
    const candidate = zonedLocalToUtc(dateStr, timeStr, timeZone);

    if (candidate <= after) continue;

    if (input.scheduleType === "daily") {
      return candidate;
    }

    if (
      input.scheduleType === "weekly" &&
      getZonedWeekday(candidate, timeZone) === input.scheduleDay
    ) {
      return candidate;
    }
  }

  return null;
}

export function formatScheduleLabel(task: {
  type: string;
  scheduleType: TaskScheduleType | null;
  scheduledAt: Date | null;
  scheduleTime: string | null;
  scheduleDay: number | null;
  nextRunAt: Date | null;
}): string | null {
  if (task.type !== "agent" || !task.scheduleType) return null;

  if (task.scheduleType === "once" && task.scheduledAt) {
    return `Once · ${format(task.scheduledAt, "MMM d, h:mm a")}`;
  }

  if (task.scheduleType === "daily" && task.scheduleTime) {
    return `Daily · ${task.scheduleTime}`;
  }

  if (task.scheduleType === "weekly" && task.scheduleTime) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[task.scheduleDay ?? 1] ?? "Mon";
    return `Weekly · ${day} ${task.scheduleTime}`;
  }

  if (task.nextRunAt) {
    return `Next · ${format(task.nextRunAt, "MMM d, h:mm a")}`;
  }

  return null;
}

/** Human due-date label like "Due today 5:00 PM" / "Overdue · Jun 12". */
export function formatDueLabel(
  dueAt: Date | null,
  now = new Date(),
): { label: string; overdue: boolean; soon: boolean } | null {
  if (!dueAt) return null;

  const overdue = dueAt.getTime() < now.getTime();
  const sameDay =
    dueAt.getFullYear() === now.getFullYear() &&
    dueAt.getMonth() === now.getMonth() &&
    dueAt.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    dueAt.getFullYear() === tomorrow.getFullYear() &&
    dueAt.getMonth() === tomorrow.getMonth() &&
    dueAt.getDate() === tomorrow.getDate();

  const soon =
    !overdue && dueAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

  let label: string;
  if (overdue) {
    label = `Overdue · ${format(dueAt, "MMM d")}`;
  } else if (sameDay) {
    label = `Due today · ${format(dueAt, "h:mm a")}`;
  } else if (isTomorrow) {
    label = `Due tomorrow · ${format(dueAt, "h:mm a")}`;
  } else {
    label = `Due ${format(dueAt, "MMM d")}`;
  }

  return { label, overdue, soon };
}

/** Short countdown like "in 2h 14m" or "in 3d" / "due now". */
export function formatRelativeRun(target: Date | null, now = new Date()): string | null {
  if (!target) return null;

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "due now";

  return `in ${formatCountdownRemaining(diffMs)}`;
}

/** Live countdown parts from remaining milliseconds — e.g. "4m 32s", "2h 5m", "3d". */
export function formatCountdownRemaining(diffMs: number): string {
  if (diffMs <= 0) return "0s";

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  if (days > 0) return `${days}d`;

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}
