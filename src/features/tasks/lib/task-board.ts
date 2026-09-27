import {
  TASK_COLUMNS,
  type TaskBoard,
  type WorkspaceTask,
} from "@/features/tasks/types/task.types";

export type TaskFilter =
  | "all"
  | "manual"
  | "agent"
  | "failed"
  | "overdue"
  | "today";

export type TaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  agent: number;
  running: number;
  completedToday: number;
  failed: number;
  overdue: number;
  dueToday: number;
};

function isToday(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isOverdue(task: WorkspaceTask): boolean {
  if (!task.dueAt || task.status === "done") return false;
  return task.dueAt.getTime() < Date.now();
}

export function isDueToday(task: WorkspaceTask): boolean {
  if (task.status === "done") return false;
  return isToday(task.dueAt);
}

export function computeTaskStats(board: TaskBoard): TaskStats {
  let total = 0;
  let agent = 0;
  let running = 0;
  let completedToday = 0;
  let failed = 0;
  let overdue = 0;
  let dueToday = 0;

  for (const column of TASK_COLUMNS) {
    for (const task of board[column.id]) {
      total += 1;
      if (task.type === "agent") agent += 1;
      if (task.status === "in_progress") running += 1;
      if (task.status === "done" && isToday(task.completedAt)) {
        completedToday += 1;
      }
      if (task.lastRunError) failed += 1;
      if (isOverdue(task)) overdue += 1;
      if (isDueToday(task)) dueToday += 1;
    }
  }

  return {
    total,
    todo: board.todo.length,
    inProgress: board.in_progress.length,
    done: board.done.length,
    agent,
    running,
    completedToday,
    failed,
    overdue,
    dueToday,
  };
}

function matchesFilter(task: WorkspaceTask, filter: TaskFilter): boolean {
  switch (filter) {
    case "manual":
      return task.type === "manual";
    case "agent":
      return task.type === "agent";
    case "failed":
      return Boolean(task.lastRunError);
    case "overdue":
      return isOverdue(task);
    case "today":
      return isDueToday(task);
    case "all":
    default:
      return true;
  }
}

function matchesQuery(task: WorkspaceTask, query: string): boolean {
  if (!query) return true;
  const haystack = [
    task.title,
    task.description,
    task.instructions,
    ...task.labels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesLabel(task: WorkspaceTask, label: string | null): boolean {
  if (!label) return true;
  return task.labels.includes(label);
}

export function filterBoard(
  board: TaskBoard,
  filter: TaskFilter,
  query: string,
  label: string | null = null,
): TaskBoard {
  const trimmed = query.trim();
  const keep = (t: WorkspaceTask) =>
    matchesFilter(t, filter) &&
    matchesQuery(t, trimmed) &&
    matchesLabel(t, label);

  return {
    todo: board.todo.filter(keep),
    in_progress: board.in_progress.filter(keep),
    done: board.done.filter(keep),
  };
}

/** Flatten board to a single ordered list (for the list view). */
export function flattenBoard(board: TaskBoard): WorkspaceTask[] {
  return [...board.todo, ...board.in_progress, ...board.done];
}
