import {
  TASK_COLUMNS,
  type TaskBoard,
  type TaskStatus,
  type WorkspaceTask,
} from "@/features/tasks/types/task.types";

/** Find a task anywhere on the board. */
export function findTaskInBoard(
  board: TaskBoard,
  taskId: string,
): WorkspaceTask | null {
  for (const column of TASK_COLUMNS) {
    const match = board[column.id].find((task) => task.id === taskId);
    if (match) return match;
  }
  return null;
}

/** Remove a task from all columns and insert it into the target column. */
export function placeTaskOnBoard(
  board: TaskBoard,
  task: WorkspaceTask,
): TaskBoard {
  const next: TaskBoard = {
    todo: board.todo.filter((t) => t.id !== task.id),
    in_progress: board.in_progress.filter((t) => t.id !== task.id),
    done: board.done.filter((t) => t.id !== task.id),
  };
  next[task.status].push(task);
  return next;
}

/** Move a task to a new column with optional field patches (optimistic UI). */
export function moveTaskInBoard(
  board: TaskBoard,
  taskId: string,
  status: TaskStatus,
  patch?: Partial<WorkspaceTask>,
): TaskBoard {
  const existing = findTaskInBoard(board, taskId);
  if (!existing) return board;

  return placeTaskOnBoard(board, {
    ...existing,
    ...patch,
    status,
  });
}
