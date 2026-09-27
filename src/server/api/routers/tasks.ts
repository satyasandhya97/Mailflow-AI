import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { runTaskById } from "@/server/services/task-agent.service";
import {
  createTaskFromText,
  generateTaskDraft,
  suggestTasks,
} from "@/server/services/task-nl.service";
import {
  countActiveTasks,
  createTask,
  deleteTask,
  listTaskBoard,
  listTaskLabels,
  listTaskRuns,
  setTaskPaused,
  updateTask,
  updateTaskStatus,
} from "@/server/services/task.service";
import {
  ensureTaskScheduler,
  runDueAgentTasksForUser,
} from "@/server/services/task-scheduler.service";

const taskTypeSchema = z.enum(["manual", "agent"]);
const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const scheduleTypeSchema = z.enum(["once", "daily", "weekly"]);
const prioritySchema = z.enum(["low", "normal", "high", "urgent"]);
const outputDeliverySchema = z.enum(["none", "email"]);
const triggerTypeSchema = z.enum(["schedule", "event"]);
const eventSourceSchema = z.enum(["gmail", "calendar"]);
const eventFilterSchema = z.object({
  from: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
});
const labelsSchema = z.array(z.string().min(1).max(40)).max(12);

export const tasksRouter = createTRPCRouter({
  listBoard: protectedProcedure.query(async ({ ctx }) => {
    ensureTaskScheduler();
    return listTaskBoard(ctx.session.user.id);
  }),

  countActive: protectedProcedure.query(async ({ ctx }) => {
    return countActiveTasks(ctx.session.user.id);
  }),

  listLabels: protectedProcedure.query(async ({ ctx }) => {
    return listTaskLabels(ctx.session.user.id);
  }),

  create: protectedProcedure
    .input(
      z
        .object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).optional(),
          type: taskTypeSchema,
          priority: prioritySchema.optional(),
          outputDelivery: outputDeliverySchema.optional(),
          dueAt: z.date().nullish(),
          labels: labelsSchema.optional(),
          maxRetries: z.number().int().min(0).max(10).optional(),
          triggerType: triggerTypeSchema.optional(),
          eventSource: eventSourceSchema.optional(),
          eventFilter: eventFilterSchema.optional(),
          instructions: z.string().max(4000).optional(),
          scheduleType: scheduleTypeSchema.optional(),
          scheduledAt: z.date().optional(),
          scheduleTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/)
            .optional(),
          scheduleDay: z.number().int().min(0).max(6).optional(),
          timezone: z.string().min(1).optional(),
        })
        .superRefine((value, ctx) => {
          if (value.type === "agent") {
            if (!value.instructions?.trim()) {
              ctx.addIssue({
                code: "custom",
                message: "Agent tasks need instructions.",
                path: ["instructions"],
              });
            }

            const isEvent = value.triggerType === "event";

            if (isEvent && !value.eventSource) {
              ctx.addIssue({
                code: "custom",
                message: "Pick an event source (Gmail or Calendar).",
                path: ["eventSource"],
              });
            }

            if (!isEvent && !value.scheduleType) {
              ctx.addIssue({
                code: "custom",
                message: "Agent tasks need a schedule.",
                path: ["scheduleType"],
              });
            }

            if (!isEvent && value.scheduleType === "once" && !value.scheduledAt) {
              ctx.addIssue({
                code: "custom",
                message: "Pick a date and time for one-time tasks.",
                path: ["scheduledAt"],
              });
            }

            if (
              !isEvent &&
              (value.scheduleType === "daily" ||
                value.scheduleType === "weekly") &&
              !value.scheduleTime
            ) {
              ctx.addIssue({
                code: "custom",
                message: "Pick a run time.",
                path: ["scheduleTime"],
              });
            }

            if (
              !isEvent &&
              value.scheduleType === "weekly" &&
              value.scheduleDay == null
            ) {
              ctx.addIssue({
                code: "custom",
                message: "Pick a weekday.",
                path: ["scheduleDay"],
              });
            }
          }
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await createTask({
        userId: ctx.session.user.id,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        outputDelivery: input.outputDelivery,
        dueAt: input.dueAt,
        labels: input.labels,
        maxRetries: input.maxRetries,
        triggerType: input.triggerType,
        eventSource: input.eventSource,
        eventFilter: input.eventFilter,
        instructions: input.instructions,
        scheduleType: input.scheduleType,
        scheduledAt: input.scheduledAt,
        scheduleTime: input.scheduleTime,
        scheduleDay: input.scheduleDay,
        timezone: input.timezone,
      });

      // If the task is already due (or due within a few seconds), run immediately.
      if (
        task.type === "agent" &&
        task.triggerType === "schedule" &&
        task.nextRunAt &&
        task.nextRunAt.getTime() <= Date.now() + 5_000
      ) {
        void runDueAgentTasksForUser(ctx.session.user.id).catch((error) => {
          console.warn("[tasks/create] auto-run failed:", error);
        });
      }

      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).nullish(),
        priority: prioritySchema.optional(),
        outputDelivery: outputDeliverySchema.optional(),
        dueAt: z.date().nullish(),
        labels: labelsSchema.optional(),
        maxRetries: z.number().int().min(0).max(10).optional(),
        eventSource: eventSourceSchema.nullish(),
        eventFilter: eventFilterSchema.optional(),
        instructions: z.string().max(4000).nullish(),
        scheduleType: scheduleTypeSchema.nullish(),
        scheduledAt: z.date().nullish(),
        scheduleTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullish(),
        scheduleDay: z.number().int().min(0).max(6).nullish(),
        timezone: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await updateTask({
        userId: ctx.session.user.id,
        taskId: input.taskId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        outputDelivery: input.outputDelivery,
        dueAt: input.dueAt,
        labels: input.labels,
        maxRetries: input.maxRetries,
        eventSource: input.eventSource,
        eventFilter: input.eventFilter,
        instructions: input.instructions,
        scheduleType: input.scheduleType,
        scheduledAt: input.scheduledAt,
        scheduleTime: input.scheduleTime,
        scheduleDay: input.scheduleDay,
        timezone: input.timezone,
      });

      if (!task) {
        throw new Error("Task not found.");
      }

      return task;
    }),

  setPaused: protectedProcedure
    .input(z.object({ taskId: z.string().min(1), paused: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const task = await setTaskPaused(
        ctx.session.user.id,
        input.taskId,
        input.paused,
      );

      if (!task) {
        throw new Error("Task not found.");
      }

      return task;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        status: taskStatusSchema,
        position: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await updateTaskStatus({
        userId: ctx.session.user.id,
        taskId: input.taskId,
        status: input.status,
        position: input.position,
      });

      if (!task) {
        throw new Error("Task not found.");
      }

      return task;
    }),

  delete: protectedProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteTask(ctx.session.user.id, input.taskId);
      return { ok };
    }),

  listRuns: protectedProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return listTaskRuns(input.taskId, ctx.session.user.id);
    }),

  runNow: protectedProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { output, task } = await runTaskById(
        ctx.session.user.id,
        input.taskId,
      );
      return { ok: true, output, task };
    }),

  /** Server-side: run any due scheduled agent tasks for the current user. */
  runDue: protectedProcedure.mutation(async ({ ctx }) => {
    ensureTaskScheduler();
    return runDueAgentTasksForUser(ctx.session.user.id);
  }),

  createFromText: protectedProcedure
    .input(z.object({ text: z.string().min(3).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      return createTaskFromText(ctx.session.user.id, input.text);
    }),

  suggest: protectedProcedure.query(async ({ ctx }) => {
    return suggestTasks(ctx.session.user.id);
  }),

  generateDraft: protectedProcedure
    .input(z.object({ hint: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      return generateTaskDraft(ctx.session.user.id, input.hint);
    }),
});
