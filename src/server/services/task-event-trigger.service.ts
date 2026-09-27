import type {
  TaskEventFilter,
  TaskEventSource,
} from "@/features/tasks/types/task.types";
import { runTaskById } from "@/server/services/task-agent.service";
import { getEventTriggeredTasks } from "@/server/services/task.service";

type EventFields = {
  from?: string;
  subject?: string;
};

function includesCi(haystack: string, needle: string | undefined): boolean {
  if (!needle?.trim()) return true;
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

function matchesEventFilter(filter: TaskEventFilter, fields: EventFields): boolean {
  return (
    includesCi(fields.from ?? "", filter.from) &&
    includesCi(fields.subject ?? "", filter.subject)
  );
}

/**
 * Run any armed, event-triggered agent tasks for a user whose filter matches
 * the incoming event. Invoked from the Gmail/Calendar webhook handlers.
 */
export async function runEventTriggeredTasks(
  userId: string,
  source: TaskEventSource,
  fields: EventFields,
): Promise<void> {
  const tasks = await getEventTriggeredTasks(userId, source);
  if (tasks.length === 0) return;

  for (const task of tasks) {
    const filter = (task.eventFilter ?? {}) as TaskEventFilter;
    if (!matchesEventFilter(filter, fields)) continue;
    if (!task.instructions?.trim()) continue;

    try {
      await runTaskById(task.userId, task.id);
      console.info("[task-event] ran event task", {
        taskId: task.id,
        source,
        title: task.title,
      });
    } catch (error) {
      console.warn("[task-event] event task failed", {
        taskId: task.id,
        source,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
