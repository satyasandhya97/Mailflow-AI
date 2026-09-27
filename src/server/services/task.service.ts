import { and, asc, count, desc, eq, inArray, lte, or } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  computeNextRunAt,
  DEFAULT_TASK_TIMEZONE,
} from "@/features/tasks/lib/task-schedule";
import { assertTaskQuality } from "@/features/tasks/lib/task-validation";
import type {
  TaskBoard,
  TaskEventFilter,
  TaskEventSource,
  TaskOutputDelivery,
  TaskPriority,
  TaskScheduleType,
  TaskStatus,
  TaskTriggerType,
  TaskType,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";
import { db } from "@/server/db";
import { taskRuns, users, workspaceTasks } from "@/server/db/schema";
import { sendTaskFailureEmail } from "@/server/services/email.service";

/** Exponential backoff (minutes) for failed agent runs, capped at 60m. */
function backoffMinutes(attempt: number): number {
  return Math.min(60, 2 ** Math.max(1, attempt));
}

/** Trim, de-dupe, drop empties, cap label list length. */
function normalizeLabels(labels: string[] | undefined): string[] {
  if (!labels) return [];
  const seen = new Set<string>();
  for (const raw of labels) {
    const trimmed = raw.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen].slice(0, 12);
}

/** Stable board sort: priority (urgent→low), then due date, then position. */
const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function compareTasks(a: WorkspaceTask, b: WorkspaceTask): number {
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;

  const aDue = a.dueAt?.getTime() ?? Infinity;
  const bDue = b.dueAt?.getTime() ?? Infinity;
  if (aDue !== bDue) return aDue - bDue;

  return a.position - b.position;
}

export type CreateTaskInput = {
  userId: string;
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  outputDelivery?: TaskOutputDelivery;
  dueAt?: Date | null;
  labels?: string[];
  maxRetries?: number;
  triggerType?: TaskTriggerType;
  eventSource?: TaskEventSource | null;
  eventFilter?: TaskEventFilter;
  instructions?: string;
  scheduleType?: TaskScheduleType;
  scheduledAt?: Date;
  scheduleTime?: string;
  scheduleDay?: number;
  timezone?: string;
};

export type UpdateTaskInput = {
  userId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  outputDelivery?: TaskOutputDelivery;
  dueAt?: Date | null;
  labels?: string[];
  maxRetries?: number;
  triggerType?: TaskTriggerType;
  eventSource?: TaskEventSource | null;
  eventFilter?: TaskEventFilter;
  instructions?: string | null;
  scheduleType?: TaskScheduleType | null;
  scheduledAt?: Date | null;
  scheduleTime?: string | null;
  scheduleDay?: number | null;
  timezone?: string;
};

export type UpdateTaskStatusInput = {
  userId: string;
  taskId: string;
  status: TaskStatus;
  position?: number;
};

function mapTask(row: typeof workspaceTasks.$inferSelect): WorkspaceTask {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    type: row.type as WorkspaceTask["type"],
    status: row.status as WorkspaceTask["status"],
    position: row.position,
    priority: row.priority as WorkspaceTask["priority"],
    paused: row.paused,
    outputDelivery: row.outputDelivery as WorkspaceTask["outputDelivery"],
    dueAt: row.dueAt,
    labels: row.labels ?? [],
    attempts: row.attempts,
    maxRetries: row.maxRetries,
    triggerType: row.triggerType as WorkspaceTask["triggerType"],
    eventSource: row.eventSource as WorkspaceTask["eventSource"],
    eventFilter: row.eventFilter ?? {},
    instructions: row.instructions,
    scheduleType: row.scheduleType as WorkspaceTask["scheduleType"],
    scheduledAt: row.scheduledAt,
    scheduleTime: row.scheduleTime,
    scheduleDay: row.scheduleDay,
    timezone: row.timezone,
    nextRunAt: row.nextRunAt,
    lastRunAt: row.lastRunAt,
    lastRunError: row.lastRunError,
    lastRunOutput: row.lastRunOutput,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function emptyBoard(): TaskBoard {
  return {
    todo: [],
    in_progress: [],
    done: [],
  };
}

async function nextPositionForStatus(userId: string, status: TaskStatus) {
  const rows = await db
    .select({ position: workspaceTasks.position })
    .from(workspaceTasks)
    .where(
      and(eq(workspaceTasks.userId, userId), eq(workspaceTasks.status, status)),
    )
    .orderBy(asc(workspaceTasks.position));

  if (rows.length === 0) return 0;
  return (rows[rows.length - 1]?.position ?? 0) + 1;
}

export async function listTaskBoard(userId: string): Promise<TaskBoard> {
  const rows = await db.query.workspaceTasks.findMany({
    where: eq(workspaceTasks.userId, userId),
    orderBy: [asc(workspaceTasks.status), asc(workspaceTasks.position)],
  });

  const board = emptyBoard();

  for (const row of rows) {
    const task = mapTask(row);
    board[task.status].push(task);
  }

  board.todo.sort(compareTasks);
  board.in_progress.sort(compareTasks);
  board.done.sort(compareTasks);

  return board;
}

/** Distinct labels across the user's tasks (for filter chips). */
export async function listTaskLabels(userId: string): Promise<string[]> {
  const rows = await db
    .select({ labels: workspaceTasks.labels })
    .from(workspaceTasks)
    .where(eq(workspaceTasks.userId, userId));

  const set = new Set<string>();
  for (const row of rows) {
    for (const label of row.labels ?? []) {
      const trimmed = label.trim();
      if (trimmed) set.add(trimmed);
    }
  }

  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function countActiveTasks(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(workspaceTasks)
    .where(
      and(
        eq(workspaceTasks.userId, userId),
        inArray(workspaceTasks.status, ["todo", "in_progress"]),
      ),
    );

  return Number(row?.value ?? 0);
}

export async function createTask(input: CreateTaskInput): Promise<WorkspaceTask> {
  assertTaskQuality({
    title: input.title,
    type: input.type,
    description: input.description,
    instructions: input.instructions,
    triggerType: input.type === "agent" ? input.triggerType : undefined,
    scheduleType: input.type === "agent" ? input.scheduleType : undefined,
  });

  const id = nanoid();
  const now = new Date();
  const timezone = input.timezone ?? DEFAULT_TASK_TIMEZONE;
  const position = await nextPositionForStatus(input.userId, "todo");

  const triggerType: TaskTriggerType =
    input.type === "agent" ? input.triggerType ?? "schedule" : "schedule";

  let nextRunAt: Date | null = null;

  // Event-triggered agent tasks have no scheduled time; they fire on events.
  if (input.type === "agent" && triggerType === "schedule" && input.scheduleType) {
    nextRunAt = computeNextRunAt({
      scheduleType: input.scheduleType,
      scheduledAt: input.scheduledAt,
      scheduleTime: input.scheduleTime,
      scheduleDay: input.scheduleDay,
      timezone,
      after: now,
    });
  }

  const [row] = await db
    .insert(workspaceTasks)
    .values({
      id,
      userId: input.userId,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      type: input.type,
      status: "todo",
      position,
      priority: input.priority ?? "normal",
      outputDelivery: input.type === "agent" ? input.outputDelivery ?? "none" : "none",
      dueAt: input.dueAt ?? null,
      labels: normalizeLabels(input.labels),
      maxRetries: input.maxRetries ?? 3,
      triggerType,
      eventSource:
        input.type === "agent" && triggerType === "event"
          ? input.eventSource ?? null
          : null,
      eventFilter:
        input.type === "agent" && triggerType === "event"
          ? input.eventFilter ?? {}
          : {},
      instructions: input.type === "agent" ? input.instructions?.trim() ?? null : null,
      scheduleType:
        input.type === "agent" && triggerType === "schedule"
          ? input.scheduleType ?? null
          : null,
      scheduledAt:
        input.type === "agent" && triggerType === "schedule"
          ? input.scheduledAt ?? null
          : null,
      scheduleTime:
        input.type === "agent" && triggerType === "schedule"
          ? input.scheduleTime ?? null
          : null,
      scheduleDay:
        input.type === "agent" && triggerType === "schedule"
          ? input.scheduleDay ?? null
          : null,
      timezone,
      nextRunAt,
      updatedAt: now,
    })
    .returning();

  return mapTask(row!);
}

export async function updateTaskStatus(
  input: UpdateTaskStatusInput,
): Promise<WorkspaceTask | null> {
  const existing = await db.query.workspaceTasks.findFirst({
    where: and(
      eq(workspaceTasks.id, input.taskId),
      eq(workspaceTasks.userId, input.userId),
    ),
  });

  if (!existing) return null;

  const now = new Date();
  const position =
    input.position ??
    (existing.status === input.status
      ? existing.position
      : await nextPositionForStatus(input.userId, input.status));

  const updates: Partial<typeof workspaceTasks.$inferInsert> = {
    status: input.status,
    position,
    updatedAt: now,
  };

  if (input.status === "done") {
    updates.completedAt = now;
    updates.nextRunAt = null;
  } else if (input.status === "todo" && existing.type === "agent") {
    updates.completedAt = null;
    if (existing.scheduleType) {
      updates.nextRunAt = computeNextRunAt({
        scheduleType: existing.scheduleType as TaskScheduleType,
        scheduledAt: existing.scheduledAt,
        scheduleTime: existing.scheduleTime,
        scheduleDay: existing.scheduleDay,
        timezone: existing.timezone,
        after: now,
      });
    }
  } else {
    updates.completedAt = null;
  }

  const [row] = await db
    .update(workspaceTasks)
    .set(updates)
    .where(eq(workspaceTasks.id, input.taskId))
    .returning();

  return row ? mapTask(row) : null;
}

export async function updateTask(
  input: UpdateTaskInput,
): Promise<WorkspaceTask | null> {
  const existing = await db.query.workspaceTasks.findFirst({
    where: and(
      eq(workspaceTasks.id, input.taskId),
      eq(workspaceTasks.userId, input.userId),
    ),
  });

  if (!existing) return null;

  const now = new Date();
  const isAgent = existing.type === "agent";

  const updates: Partial<typeof workspaceTasks.$inferInsert> = {
    updatedAt: now,
  };

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined)
    updates.description = input.description?.trim() ?? null;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.dueAt !== undefined) updates.dueAt = input.dueAt;
  if (input.labels !== undefined) updates.labels = normalizeLabels(input.labels);
  if (input.maxRetries !== undefined) updates.maxRetries = input.maxRetries;

  if (isAgent) {
    if (input.outputDelivery !== undefined)
      updates.outputDelivery = input.outputDelivery;
    if (input.eventSource !== undefined) updates.eventSource = input.eventSource;
    if (input.eventFilter !== undefined) updates.eventFilter = input.eventFilter;
    if (input.instructions !== undefined)
      updates.instructions = input.instructions?.trim() ?? null;
    if (input.timezone !== undefined) updates.timezone = input.timezone;

    const scheduleChanged =
      input.scheduleType !== undefined ||
      input.scheduledAt !== undefined ||
      input.scheduleTime !== undefined ||
      input.scheduleDay !== undefined ||
      input.timezone !== undefined;

    if (input.scheduleType !== undefined)
      updates.scheduleType = input.scheduleType;
    if (input.scheduledAt !== undefined)
      updates.scheduledAt = input.scheduledAt;
    if (input.scheduleTime !== undefined)
      updates.scheduleTime = input.scheduleTime;
    if (input.scheduleDay !== undefined)
      updates.scheduleDay = input.scheduleDay;

    if (scheduleChanged && existing.status !== "done") {
      const scheduleType = (input.scheduleType !== undefined
        ? input.scheduleType
        : existing.scheduleType) as TaskScheduleType | null;

      updates.nextRunAt = scheduleType
        ? computeNextRunAt({
            scheduleType,
            scheduledAt:
              input.scheduledAt !== undefined
                ? input.scheduledAt
                : existing.scheduledAt,
            scheduleTime:
              input.scheduleTime !== undefined
                ? input.scheduleTime
                : existing.scheduleTime,
            scheduleDay:
              input.scheduleDay !== undefined
                ? input.scheduleDay
                : existing.scheduleDay,
            timezone: input.timezone ?? existing.timezone,
            after: now,
          })
        : null;
    }
  }

  const [row] = await db
    .update(workspaceTasks)
    .set(updates)
    .where(eq(workspaceTasks.id, input.taskId))
    .returning();

  return row ? mapTask(row) : null;
}

export async function setTaskPaused(
  userId: string,
  taskId: string,
  paused: boolean,
): Promise<WorkspaceTask | null> {
  const existing = await db.query.workspaceTasks.findFirst({
    where: and(
      eq(workspaceTasks.id, taskId),
      eq(workspaceTasks.userId, userId),
    ),
  });

  if (!existing) return null;

  const now = new Date();
  const updates: Partial<typeof workspaceTasks.$inferInsert> = {
    paused,
    updatedAt: now,
  };

  // When resuming an agent task that is not done, recompute its next run.
  if (!paused && existing.type === "agent" && existing.status !== "done") {
    updates.nextRunAt = existing.scheduleType
      ? computeNextRunAt({
          scheduleType: existing.scheduleType as TaskScheduleType,
          scheduledAt: existing.scheduledAt,
          scheduleTime: existing.scheduleTime,
          scheduleDay: existing.scheduleDay,
          timezone: existing.timezone,
          after: now,
        })
      : existing.nextRunAt;
  }

  const [row] = await db
    .update(workspaceTasks)
    .set(updates)
    .where(eq(workspaceTasks.id, taskId))
    .returning();

  return row ? mapTask(row) : null;
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(workspaceTasks)
    .where(
      and(eq(workspaceTasks.id, taskId), eq(workspaceTasks.userId, userId)),
    )
    .returning({ id: workspaceTasks.id });

  return deleted.length > 0;
}

export async function listTaskRuns(taskId: string, userId: string) {
  const task = await db.query.workspaceTasks.findFirst({
    where: and(
      eq(workspaceTasks.id, taskId),
      eq(workspaceTasks.userId, userId),
    ),
  });

  if (!task) return [];

  const rows = await db.query.taskRuns.findMany({
    where: eq(taskRuns.taskId, taskId),
    orderBy: [desc(taskRuns.startedAt)],
    limit: 10,
  });

  return rows;
}

export async function getDueAgentTasks(limit = 20) {
  const now = new Date();

  return db.query.workspaceTasks.findMany({
    where: and(
      eq(workspaceTasks.type, "agent"),
      eq(workspaceTasks.triggerType, "schedule"),
      eq(workspaceTasks.paused, false),
      lte(workspaceTasks.nextRunAt, now),
      // Recurring tasks land in Done after a run; pick them up again when due.
      or(
        eq(workspaceTasks.status, "todo"),
        eq(workspaceTasks.status, "done"),
      ),
    ),
    orderBy: [asc(workspaceTasks.nextRunAt)],
    limit,
  });
}

/** Due scheduled agent tasks for a single user (client tick + post-create). */
export async function getDueAgentTasksForUser(userId: string, limit = 10) {
  const now = new Date();

  return db.query.workspaceTasks.findMany({
    where: and(
      eq(workspaceTasks.userId, userId),
      eq(workspaceTasks.type, "agent"),
      eq(workspaceTasks.triggerType, "schedule"),
      eq(workspaceTasks.paused, false),
      lte(workspaceTasks.nextRunAt, now),
      or(
        eq(workspaceTasks.status, "todo"),
        eq(workspaceTasks.status, "done"),
      ),
    ),
    orderBy: [asc(workspaceTasks.nextRunAt)],
    limit,
  });
}

/** Armed, event-triggered agent tasks for a user + source (e.g. gmail). */
export async function getEventTriggeredTasks(
  userId: string,
  eventSource: TaskEventSource,
) {
  return db.query.workspaceTasks.findMany({
    where: and(
      eq(workspaceTasks.userId, userId),
      eq(workspaceTasks.type, "agent"),
      eq(workspaceTasks.triggerType, "event"),
      eq(workspaceTasks.eventSource, eventSource),
      eq(workspaceTasks.paused, false),
      or(
        eq(workspaceTasks.status, "todo"),
        eq(workspaceTasks.status, "done"),
      ),
    ),
    limit: 20,
  });
}

export async function claimTaskForRun(taskId: string): Promise<boolean> {
  const now = new Date();

  const rows = await db
    .update(workspaceTasks)
    .set({
      status: "in_progress",
      lastRunError: null,
      completedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(workspaceTasks.id, taskId),
        or(
          eq(workspaceTasks.status, "todo"),
          eq(workspaceTasks.status, "done"),
        ),
      ),
    )
    .returning({ id: workspaceTasks.id });

  return rows.length > 0;
}

export async function markTaskRunning(taskId: string) {
  await claimTaskForRun(taskId);
}

export async function completeAgentTaskRun(input: {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
}) {
  const task = await db.query.workspaceTasks.findFirst({
    where: eq(workspaceTasks.id, input.taskId),
  });

  if (!task) return;

  const now = new Date();
  const isRecurring =
    task.scheduleType === "daily" || task.scheduleType === "weekly";

  const nextRecurringRun = () =>
    computeNextRunAt({
      scheduleType: task.scheduleType as TaskScheduleType,
      scheduledAt: task.scheduledAt,
      scheduleTime: task.scheduleTime,
      scheduleDay: task.scheduleDay,
      timezone: task.timezone,
      after: now,
    });

  if (input.success) {
    // Every successful run ends in Done so the board reflects completion.
    // Recurring tasks keep nextRunAt so the scheduler can re-run when due.
    const nextRunAt = isRecurring ? nextRecurringRun() : null;

    await db
      .update(workspaceTasks)
      .set({
        status: "done",
        attempts: 0,
        nextRunAt,
        lastRunAt: now,
        lastRunError: null,
        lastRunOutput: input.output ?? null,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(workspaceTasks.id, input.taskId));

    return;
  }

  // Failure path with exponential backoff.
  const attempts = (task.attempts ?? 0) + 1;
  const message = input.error ?? "Agent run failed";
  const canRetry = attempts < (task.maxRetries ?? 3);

  if (canRetry) {
    const retryAt = new Date(now.getTime() + backoffMinutes(attempts) * 60_000);
    await db
      .update(workspaceTasks)
      .set({
        status: "todo",
        attempts,
        nextRunAt: retryAt,
        lastRunAt: now,
        lastRunError: message,
        updatedAt: now,
      })
      .where(eq(workspaceTasks.id, input.taskId));
    return;
  }

  // Retries exhausted (or event task): stop retrying, surface the error, and
  // notify the owner. Recurring tasks skip to their next scheduled occurrence.
  const nextRunAt = isRecurring ? nextRecurringRun() : null;

  await db
    .update(workspaceTasks)
    .set({
      status: "todo",
      attempts: 0,
      nextRunAt,
      lastRunAt: now,
      lastRunError: message,
      updatedAt: now,
    })
    .where(eq(workspaceTasks.id, input.taskId));

  const owner = await db.query.users.findFirst({
    where: eq(users.id, task.userId),
  });
  if (owner?.email) {
    await sendTaskFailureEmail({
      email: owner.email,
      taskTitle: task.title,
      error: message,
      attempts,
    });
  }
}

export async function getTaskForUser(userId: string, taskId: string) {
  const row = await db.query.workspaceTasks.findFirst({
    where: and(
      eq(workspaceTasks.id, taskId),
      eq(workspaceTasks.userId, userId),
    ),
  });

  return row ? mapTask(row) : null;
}

export async function createTaskRun(taskId: string) {
  const id = nanoid();

  await db.insert(taskRuns).values({
    id,
    taskId,
    status: "running",
  });

  return id;
}

export async function finishTaskRun(input: {
  runId: string;
  status: "success" | "failed";
  output?: string;
  error?: string;
}) {
  await db
    .update(taskRuns)
    .set({
      status: input.status,
      output: input.output ?? null,
      error: input.error ?? null,
      finishedAt: new Date(),
    })
    .where(eq(taskRuns.id, input.runId));
}
