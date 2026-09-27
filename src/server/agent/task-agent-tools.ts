import { tool, type ToolSet } from "ai";
import { z } from "zod";

import { computeNextRunAt } from "@/features/tasks/lib/task-schedule";
import { assertTaskQuality } from "@/features/tasks/lib/task-validation";
import type { TaskStatus } from "@/features/tasks/types/task.types";
import type { WorkspaceTask } from "@/features/tasks/types/task.types";
import { safeToolExecute } from "@/server/agent/tool-error";
import { runTaskById } from "@/server/services/task-agent.service";
import {
  createTask,
  deleteTask,
  getTaskForUser,
  listTaskBoard,
  updateTask,
  updateTaskStatus,
} from "@/server/services/task.service";

type TaskAgentToolsOptions = {
  userId: string;
  /** Disable run_task while already inside a background task run (prevents recursion). */
  allowRun?: boolean;
};

const taskDraftInputSchema = z.object({
  title: z.string().min(4).max(200),
  description: z
    .string()
    .min(10)
    .max(2000)
    .optional()
    .describe(
      "Required for professional tasks: 2-4 sentences on goal and success criteria",
    ),
  type: z.enum(["manual", "agent"]).default("manual"),
  priority: z
    .enum(["low", "normal", "high", "urgent"])
    .optional()
    .describe("Task priority; defaults to normal"),
  labels: z
    .array(z.string().min(1).max(40))
    .max(8)
    .optional()
    .describe("Short lowercase tags, e.g. ['email','report']"),
  dueAt: z
    .string()
    .optional()
    .describe("ISO datetime deadline (mainly for manual to-dos)"),
  outputDelivery: z
    .enum(["none", "email"])
    .optional()
    .describe("For agent tasks: email results when done"),
  triggerType: z
    .enum(["schedule", "event"])
    .optional()
    .describe(
      "Agent tasks: 'schedule' runs on a time, 'event' runs when a Gmail/Calendar event fires",
    ),
  eventSource: z
    .enum(["gmail", "calendar"])
    .optional()
    .describe("Required when triggerType='event'"),
  eventFrom: z
    .string()
    .optional()
    .describe("Event tasks: only fire when sender contains this"),
  eventSubject: z
    .string()
    .optional()
    .describe("Event tasks: only fire when subject/title contains this"),
  instructions: z
    .string()
    .max(4000)
    .optional()
    .describe("Required for agent tasks: what the agent should do each run"),
  scheduleType: z
    .enum(["once", "daily", "weekly"])
    .optional()
    .describe("Required for scheduled agent tasks"),
  scheduledAt: z
    .string()
    .optional()
    .describe("ISO datetime for one-time agent tasks"),
  scheduleTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe("HH:mm 24h time for daily/weekly tasks (Asia/Kolkata)"),
  scheduleDay: z
    .number()
    .int()
    .min(0)
    .max(6)
    .optional()
    .describe("0=Sunday..6=Saturday for weekly tasks"),
});

const taskUpdateInputSchema = z.object({
  taskId: z.string().min(1).describe("ID of the task to update"),
  title: z.string().min(4).max(200).optional(),
  description: z.string().max(2000).nullish().optional(),
  status: z
    .enum(["todo", "in_progress", "done"])
    .optional()
    .describe("Move task to a board column"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  labels: z.array(z.string().min(1).max(40)).max(8).optional(),
  dueAt: z
    .string()
    .nullish()
    .optional()
    .describe("ISO datetime deadline, or null to clear"),
  outputDelivery: z.enum(["none", "email"]).optional(),
  instructions: z.string().max(4000).nullish().optional(),
  scheduleType: z.enum(["once", "daily", "weekly"]).nullish().optional(),
  scheduledAt: z.string().nullish().optional(),
  scheduleTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullish()
    .optional(),
  scheduleDay: z.number().int().min(0).max(6).nullish().optional(),
  eventSource: z.enum(["gmail", "calendar"]).nullish().optional(),
  eventFrom: z.string().max(200).optional(),
  eventSubject: z.string().max(200).optional(),
});

function serializeTaskForAgent(task: WorkspaceTask) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    priority: task.priority,
    labels: task.labels,
    dueAt: task.dueAt?.toISOString() ?? null,
    instructions: task.instructions,
    outputDelivery: task.outputDelivery,
    triggerType: task.triggerType,
    eventSource: task.eventSource,
    eventFilter: task.eventFilter,
    scheduleType: task.scheduleType,
    scheduledAt: task.scheduledAt?.toISOString() ?? null,
    scheduleTime: task.scheduleTime,
    scheduleDay: task.scheduleDay,
    nextRunAt: task.nextRunAt?.toISOString() ?? null,
    lastRunError: task.lastRunError,
    paused: task.paused,
  };
}

function parseOptionalDate(
  value: string | null | undefined,
  fieldName: string,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }

  return parsed;
}

function hasTaskFieldUpdates(input: z.infer<typeof taskUpdateInputSchema>) {
  return [
    input.title,
    input.description,
    input.priority,
    input.dueAt,
    input.labels,
    input.instructions,
    input.outputDelivery,
    input.scheduleType,
    input.scheduledAt,
    input.scheduleTime,
    input.scheduleDay,
    input.eventSource,
    input.eventFrom,
    input.eventSubject,
  ].some((value) => value !== undefined);
}

function withInferredTriggerType(
  input: z.infer<typeof taskDraftInputSchema>,
): z.infer<typeof taskDraftInputSchema> {
  if (input.type !== "agent" || input.triggerType) return input;
  if (input.eventSource) return { ...input, triggerType: "event" };
  return { ...input, triggerType: "schedule" };
}

function validateAgentTaskInput(input: z.infer<typeof taskDraftInputSchema>) {
  const normalized = withInferredTriggerType(input);
  const isEvent = normalized.triggerType === "event";

  if (input.type === "agent") {
    if (!input.instructions?.trim()) {
      throw new Error("Agent tasks require instructions.");
    }
    if (isEvent) {
      if (!normalized.eventSource) {
        throw new Error(
          "Event-triggered tasks require eventSource (gmail/calendar).",
        );
      }
    } else {
      if (!normalized.scheduleType) {
        throw new Error("Agent tasks require a schedule (once/daily/weekly).");
      }
      if (normalized.scheduleType === "once" && !normalized.scheduledAt) {
        throw new Error("One-time agent tasks require scheduledAt.");
      }
      if (
        (normalized.scheduleType === "daily" ||
          normalized.scheduleType === "weekly") &&
        !normalized.scheduleTime
      ) {
        throw new Error("Daily/weekly agent tasks require scheduleTime (HH:mm).");
      }
      if (normalized.scheduleType === "weekly" && normalized.scheduleDay == null) {
        throw new Error("Weekly agent tasks require scheduleDay (0-6).");
      }
    }
  }
}

function formatTaskDraftSummary(input: z.infer<typeof taskDraftInputSchema>) {
  const isEvent = input.triggerType === "event";
  let schedule = "None";
  if (input.type === "agent") {
    if (isEvent) {
      const filters = [
        input.eventFrom ? `from contains "${input.eventFrom}"` : null,
        input.eventSubject ? `subject contains "${input.eventSubject}"` : null,
      ].filter(Boolean);
      schedule = `Event: ${input.eventSource}${filters.length ? ` (${filters.join(", ")})` : ""}`;
    } else if (input.scheduleType === "once") {
      schedule = `Once at ${input.scheduledAt ?? "?"}`;
    } else if (input.scheduleType === "daily") {
      schedule = `Daily at ${input.scheduleTime ?? "?"}`;
    } else if (input.scheduleType === "weekly") {
      schedule = `Weekly (day ${input.scheduleDay ?? "?"}) at ${input.scheduleTime ?? "?"}`;
    }
  }

  return {
    title: input.title,
    description: input.description ?? null,
    type: input.type,
    priority: input.priority ?? "normal",
    labels: input.labels ?? [],
    dueAt: input.dueAt ?? null,
    outputDelivery: input.outputDelivery ?? "none",
    schedule,
    instructions: input.type === "agent" ? (input.instructions ?? null) : null,
    readyToCreate: true,
    message:
      "Show this summary to the user and ask for explicit confirmation before calling create_workspace_task with userConfirmed: true.",
  };
}

export function buildTaskAgentTools(options: TaskAgentToolsOptions): ToolSet {
  const { userId, allowRun = true } = options;

  const tools: ToolSet = {
    list_workspace_tasks: tool({
      description:
        "List the user's workspace tasks (manual to-dos and scheduled agent tasks) grouped by board column. Use to answer 'what are my tasks', 'what's in progress', etc.",
      inputSchema: z.object({
        status: z
          .enum(["todo", "in_progress", "done"])
          .optional()
          .describe("Filter to a single board column"),
      }),
      execute: safeToolExecute(async (input) => {
        const board = await listTaskBoard(userId);
        const columns: TaskStatus[] = input.status
          ? [input.status]
          : ["todo", "in_progress", "done"];

        const tasks = columns.flatMap((column) =>
          board[column].map((task) => ({
            ...serializeTaskForAgent(task),
          })),
        );

        return JSON.stringify({ count: tasks.length, tasks });
      }),
    }),

    get_workspace_task: tool({
      description:
        "Get full details of one workspace task by ID. Use before updating when you need the current title, status, schedule, or description.",
      inputSchema: z.object({
        taskId: z.string().min(1),
      }),
      execute: safeToolExecute(async (input) => {
        const task = await getTaskForUser(userId, input.taskId);
        if (!task) {
          throw new Error("Task not found.");
        }

        return JSON.stringify({ task: serializeTaskForAgent(task) });
      }),
    }),

    prepare_task_draft: tool({
      description:
        "Prepare a task draft for user review. Does NOT save to the database. Call after intake questions are answered, then show the summary and ask the user to confirm before create_workspace_task.",
      inputSchema: taskDraftInputSchema,
      execute: safeToolExecute(async (input) => {
        const draft = withInferredTriggerType(input);
        validateAgentTaskInput(draft);
        assertTaskQuality({
          title: draft.title,
          type: draft.type,
          description: draft.description,
          instructions: draft.instructions,
          triggerType: draft.triggerType,
          scheduleType: draft.scheduleType,
        });
        return JSON.stringify(formatTaskDraftSummary(draft));
      }),
    }),

    create_workspace_task: tool({
      description:
        "Save a workspace task after the user explicitly confirmed a prepare_task_draft summary. Requires userConfirmed: true.",
      inputSchema: taskDraftInputSchema.extend({
        userConfirmed: z
          .literal(true)
          .describe(
            "Must be true — only set after the user explicitly says yes / go ahead / create it",
          ),
      }),
      execute: safeToolExecute(async (input) => {
        if (!input.userConfirmed) {
          throw new Error(
            "User must confirm the task draft before creation. Use prepare_task_draft first.",
          );
        }

        const draft = withInferredTriggerType(input);
        const isEvent = draft.triggerType === "event";
        validateAgentTaskInput(draft);

        const scheduledAt =
          draft.scheduledAt && draft.type === "agent" && !isEvent
            ? new Date(draft.scheduledAt)
            : undefined;

        if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
          throw new Error(`Invalid scheduledAt: ${draft.scheduledAt}`);
        }

        const dueAt = draft.dueAt ? new Date(draft.dueAt) : undefined;
        if (dueAt && Number.isNaN(dueAt.getTime())) {
          throw new Error(`Invalid dueAt: ${draft.dueAt}`);
        }

        assertTaskQuality({
          title: draft.title,
          type: draft.type,
          description: draft.description,
          instructions: draft.instructions,
          triggerType: draft.triggerType,
          scheduleType: draft.scheduleType,
        });

        const task = await createTask({
          userId,
          title: draft.title,
          description: draft.description,
          type: draft.type,
          priority: draft.priority,
          labels: draft.labels,
          dueAt,
          outputDelivery: draft.outputDelivery,
          instructions: draft.instructions,
          triggerType: draft.type === "agent" ? draft.triggerType : undefined,
          eventSource: isEvent ? draft.eventSource : undefined,
          eventFilter: isEvent
            ? { from: draft.eventFrom, subject: draft.eventSubject }
            : undefined,
          scheduleType: isEvent ? undefined : draft.scheduleType,
          scheduledAt,
          scheduleTime: isEvent ? undefined : draft.scheduleTime,
          scheduleDay: isEvent ? undefined : draft.scheduleDay,
        });

        return JSON.stringify({
          created: true,
          id: task.id,
          title: task.title,
          type: task.type,
          status: task.status,
          nextRunAt: task.nextRunAt?.toISOString() ?? null,
        });
      }),
    }),

    update_workspace_task: tool({
      description:
        "Update an existing workspace task. Provide taskId plus only the fields that should change (title, description, status, priority, due date, labels, schedule, instructions, etc.). Use get_workspace_task or list_workspace_tasks first if you need the task ID.",
      inputSchema: taskUpdateInputSchema,
      execute: safeToolExecute(async (input) => {
        const existing = await getTaskForUser(userId, input.taskId);
        if (!existing) {
          throw new Error("Task not found.");
        }

        if (!hasTaskFieldUpdates(input) && !input.status) {
          throw new Error("Provide at least one field to update.");
        }

        let task = existing;

        if (hasTaskFieldUpdates(input)) {
          if (
            input.title !== undefined ||
            input.description !== undefined ||
            input.instructions !== undefined
          ) {
            assertTaskQuality({
              title: input.title ?? existing.title,
              type: existing.type,
              description:
                input.description !== undefined
                  ? (input.description ?? undefined)
                  : (existing.description ?? undefined),
              instructions:
                input.instructions !== undefined
                  ? (input.instructions ?? undefined)
                  : (existing.instructions ?? undefined),
              triggerType: existing.triggerType,
              scheduleType:
                input.scheduleType !== undefined
                  ? (input.scheduleType ?? undefined)
                  : (existing.scheduleType ?? undefined),
            });
          }

          const dueAt = parseOptionalDate(input.dueAt, "dueAt");
          const scheduledAt = parseOptionalDate(input.scheduledAt, "scheduledAt");
          const eventFilter =
            input.eventFrom !== undefined || input.eventSubject !== undefined
              ? {
                  from: input.eventFrom,
                  subject: input.eventSubject,
                }
              : undefined;

          const updated = await updateTask({
            userId,
            taskId: input.taskId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            dueAt,
            labels: input.labels,
            instructions: input.instructions,
            outputDelivery: input.outputDelivery,
            scheduleType: input.scheduleType,
            scheduledAt,
            scheduleTime: input.scheduleTime,
            scheduleDay: input.scheduleDay,
            eventSource: input.eventSource,
            eventFilter,
          });

          if (!updated) {
            throw new Error("Task not found.");
          }

          task = updated;
        }

        if (input.status && input.status !== task.status) {
          const updated = await updateTaskStatus({
            userId,
            taskId: input.taskId,
            status: input.status,
          });

          if (!updated) {
            throw new Error("Task not found.");
          }

          task = updated;
        }

        return JSON.stringify({
          updated: true,
          task: serializeTaskForAgent(task),
        });
      }),
    }),

    update_workspace_task_status: tool({
      description:
        "Move a task to a different board column (todo, in_progress, done). Use to mark a task complete or reopen it.",
      inputSchema: z.object({
        taskId: z.string().min(1),
        status: z.enum(["todo", "in_progress", "done"]),
      }),
      execute: safeToolExecute(async (input) => {
        const task = await updateTaskStatus({
          userId,
          taskId: input.taskId,
          status: input.status,
        });

        if (!task) {
          throw new Error("Task not found.");
        }

        return JSON.stringify({
          updated: true,
          id: task.id,
          status: task.status,
          nextRunAt: task.nextRunAt?.toISOString() ?? null,
        });
      }),
    }),

    delete_workspace_task: tool({
      description:
        "Permanently delete a workspace task by ID. Requires user approval in the UI before deletion runs. Always call this when the user asks to delete/remove a task.",
      inputSchema: z.object({
        taskId: z.string().min(1),
      }),
      needsApproval: true,
      execute: safeToolExecute(async (input) => {
        const existing = await getTaskForUser(userId, input.taskId);
        if (!existing) {
          throw new Error("Task not found.");
        }

        const ok = await deleteTask(userId, input.taskId);
        if (!ok) {
          throw new Error("Task not found.");
        }

        return JSON.stringify({
          deleted: true,
          id: existing.id,
          title: existing.title,
        });
      }),
    }),

    preview_task_next_run: tool({
      description:
        "Compute the next run time for a schedule without creating a task. Useful to confirm timing with the user before creating an agent task.",
      inputSchema: z.object({
        scheduleType: z.enum(["once", "daily", "weekly"]),
        scheduledAt: z.string().optional(),
        scheduleTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        scheduleDay: z.number().int().min(0).max(6).optional(),
      }),
      execute: safeToolExecute(async (input) => {
        const nextRunAt = computeNextRunAt({
          scheduleType: input.scheduleType,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          scheduleTime: input.scheduleTime,
          scheduleDay: input.scheduleDay,
        });

        return JSON.stringify({
          nextRunAt: nextRunAt?.toISOString() ?? null,
        });
      }),
    }),
  };

  if (allowRun) {
    tools.run_workspace_task = tool({
      description:
        "Immediately run an agent task by ID using your tools, instead of waiting for its schedule.",
      inputSchema: z.object({
        taskId: z.string().min(1),
      }),
      execute: safeToolExecute(async (input) => {
        const existing = await getTaskForUser(userId, input.taskId);
        if (!existing) {
          throw new Error("Task not found.");
        }

        const { output, task: updated } = await runTaskById(userId, input.taskId);

        return JSON.stringify({
          ran: true,
          id: input.taskId,
          status: updated.status,
          output,
        });
      }),
    });
  }

  return tools;
}
