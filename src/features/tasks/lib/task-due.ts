import type { TaskBoard, WorkspaceTask } from "@/features/tasks/types/task.types";

/** Agent task with a time-based schedule (not event-triggered). */
export function isScheduledAgentTask(task: WorkspaceTask): boolean {
  return (
    task.type === "agent" &&
    task.triggerType === "schedule" &&
    !task.paused &&
    Boolean(task.nextRunAt)
  );
}

/** Task eligible for automatic / scheduled execution right now. */
export function isDueForAutoRun(task: WorkspaceTask, now = Date.now()): boolean {
  if (!isScheduledAgentTask(task)) return false;
  if (task.status === "in_progress") return false;
  if (task.status !== "todo" && task.status !== "done") return false;
  return new Date(task.nextRunAt!).getTime() <= now;
}

/** Stable key so we auto-run once per scheduled occurrence. */
export function autoRunKey(task: WorkspaceTask): string {
  return `${task.id}:${task.nextRunAt?.getTime() ?? 0}`;
}

export function collectDueTasks(board: TaskBoard, now = Date.now()): WorkspaceTask[] {
  return [...board.todo, ...board.done].filter((task) =>
    isDueForAutoRun(task, now),
  );
}

export function hasDueScheduledTasks(board: TaskBoard, now = Date.now()): boolean {
  return collectDueTasks(board, now).length > 0;
}

/** Next scheduled run across the board (ms from now), or null. */
export function msUntilNextRun(board: TaskBoard, now = Date.now()): number | null {
  let nearest: number | null = null;

  for (const task of [...board.todo, ...board.done, ...board.in_progress]) {
    if (!isScheduledAgentTask(task) || task.status === "in_progress") continue;
    const diff = new Date(task.nextRunAt!).getTime() - now;
    if (diff <= 0) continue;
    if (nearest === null || diff < nearest) nearest = diff;
  }

  return nearest;
}

/** Whether to show a live countdown on the card. */
export function shouldShowCountdown(task: WorkspaceTask): boolean {
  if (!isScheduledAgentTask(task)) return false;
  if (task.status === "in_progress") return false;
  if (task.status === "todo") return true;
  if (task.status === "done") {
    return task.scheduleType === "daily" || task.scheduleType === "weekly";
  }
  return false;
}

/** Optimized board refetch interval based on task timing. */
export function boardRefetchIntervalMs(board: TaskBoard | undefined): number {
  if (!board) return 15_000;
  if (board.in_progress.length > 0) return 1_500;
  if (hasDueScheduledTasks(board)) return 2_000;

  const until = msUntilNextRun(board);
  if (until !== null && until <= 60_000) return 3_000;
  if (until !== null && until <= 15 * 60_000) return 8_000;

  return 20_000;
}
