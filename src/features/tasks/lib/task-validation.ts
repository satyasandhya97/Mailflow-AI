import type { TaskType } from "@/features/tasks/types/task.types";

export type TaskValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const VAGUE_TITLE =
  /^(task|new task|todo|untitled|create task|my task|untitled task)$/i;

export function validateTaskDraft(input: {
  title: string;
  type: TaskType;
  description?: string;
  instructions?: string;
  triggerType?: "schedule" | "event";
  scheduleType?: string | null;
}): TaskValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const title = input.title.trim();
  if (!title) {
    errors.push("Title is required.");
  } else if (title.length < 4) {
    errors.push("Title is too short — use a specific action-oriented name.");
  } else if (VAGUE_TITLE.test(title)) {
    errors.push(
      'Title is too generic — describe what the task does (e.g. "Morning inbox summary").',
    );
  }

  const description = input.description?.trim() ?? "";
  const instructions = input.instructions?.trim() ?? "";

  if (input.type === "manual") {
    if (!description && title.length < 12) {
      warnings.push(
        "Add a description so this task is clear when you revisit it.",
      );
    }
  }

  if (input.type === "agent") {
    if (!instructions) {
      errors.push("Agent tasks need step-by-step instructions.");
    } else if (instructions.length < 30) {
      errors.push(
        "Instructions are too brief — explain what the agent should do, which tools to use, and what to deliver.",
      );
    } else if (instructions.split(/\s+/).length < 8) {
      warnings.push(
        "Consider adding more detail so the agent can run without guessing.",
      );
    }

    if (
      input.triggerType !== "event" &&
      !input.scheduleType
    ) {
      errors.push("Pick a schedule for this agent task.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** Server-side guard for agent tool and API creates. */
export function assertTaskQuality(input: {
  title: string;
  type: TaskType;
  description?: string;
  instructions?: string;
  triggerType?: "schedule" | "event";
  scheduleType?: string | null;
}) {
  const result = validateTaskDraft(input);
  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}
