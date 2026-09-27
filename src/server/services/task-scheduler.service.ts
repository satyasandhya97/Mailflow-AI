import { runTaskById } from "@/server/services/task-agent.service";
import {
  completeAgentTaskRun,
  getDueAgentTasks,
  getDueAgentTasksForUser,
} from "@/server/services/task.service";

const SCHEDULER_POLL_MS =
  process.env.NODE_ENV === "production" ? 30_000 : 5_000;

async function executeDueTasks(
  tasks: Awaited<ReturnType<typeof getDueAgentTasks>>,
) {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const task of tasks) {
    processed += 1;

    if (!task.instructions?.trim()) {
      await completeAgentTaskRun({
        taskId: task.id,
        success: false,
        error: "Missing agent instructions.",
      });
      failed += 1;
      continue;
    }

    try {
      await runTaskById(task.userId, task.id);
      succeeded += 1;
      console.info("[task-scheduler] completed", {
        taskId: task.id,
        userId: task.userId,
        title: task.title,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already running") || message.includes("not available")) {
        continue;
      }
      failed += 1;
      console.warn("[task-scheduler] failed", {
        taskId: task.id,
        userId: task.userId,
        message,
      });
    }
  }

  return { processed, succeeded, failed };
}

export async function runDueAgentTasks(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  return executeDueTasks(await getDueAgentTasks());
}

export async function runDueAgentTasksForUser(userId: string): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  return executeDueTasks(await getDueAgentTasksForUser(userId));
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null;

export function startTaskScheduler() {
  if (schedulerTimer) return;

  const tick = () => {
    void runDueAgentTasks().catch((error) => {
      console.error("[task-scheduler] tick failed:", error);
    });
  };

  tick();
  schedulerTimer = setInterval(tick, SCHEDULER_POLL_MS);
  console.info(`[task-scheduler] polling every ${SCHEDULER_POLL_MS / 1000}s`);
}

/** Idempotent — safe to call from instrumentation, cron, or API handlers. */
export function ensureTaskScheduler() {
  startTaskScheduler();
}
