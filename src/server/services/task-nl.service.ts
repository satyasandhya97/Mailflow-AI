import { generateText, type LanguageModel } from "ai";
import { z } from "zod";

import { DEFAULT_TASK_TIMEZONE } from "@/features/tasks/lib/task-schedule";
import type { WorkspaceTask } from "@/features/tasks/types/task.types";
import { resolveAgentModelForTier } from "@/server/agent/resolve-agent-model";
import { getAgentCapabilities } from "@/server/services/plugin-settings.service";
import { createTask } from "@/server/services/task.service";

/**
 * Generate JSON from a model and validate it with a schema. Uses generateText
 * + manual parsing (instead of generateObject) so it works on every provider,
 * including Groq models that don't support `response_format: json_schema`.
 */
async function generateJson<T extends z.ZodTypeAny>(
  model: LanguageModel,
  schema: T,
  system: string,
  prompt: string,
): Promise<z.infer<T>> {
  const result = await generateText({
    model,
    system: `${system}\n\nRespond with ONLY a single valid JSON object. No markdown, no code fences, no commentary.`,
    prompt,
  });

  const text = result.text.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not understand that. Try rephrasing the task.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Could not understand that. Try rephrasing the task.");
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("Could not understand that. Try rephrasing the task.");
  }

  return validated.data;
}

const parsedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["manual", "agent"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  instructions: z.string().max(4000).optional(),
  scheduleType: z.enum(["once", "daily", "weekly"]).optional(),
  scheduleTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  scheduleDay: z.number().int().min(0).max(6).optional(),
  scheduledAt: z.string().optional(),
  dueAt: z.string().optional(),
  labels: z.array(z.string().min(1).max(40)).max(8).optional(),
});

function parseIso(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function nowContext() {
  const now = new Date();
  return `Current date/time: ${now.toISOString()} (timezone ${DEFAULT_TASK_TIMEZONE}).`;
}

export type TaskDraft = z.infer<typeof parsedTaskSchema>;

function isVagueTaskHint(hint: string): boolean {
  const normalized = hint.trim().toLowerCase();
  return (
    !normalized ||
    /^(create\s*(a\s*)?task|new\s*task|add\s*(a\s*)?task|task)$/.test(normalized)
  );
}

/**
 * Generate a complete, execution-ready task draft from a short hint or title.
 * Does not save — used to prefill the create dialog.
 */
export async function generateTaskDraft(
  userId: string,
  hint: string,
): Promise<TaskDraft> {
  if (isVagueTaskHint(hint)) {
    throw new Error(
      "Describe what you want — e.g. 'daily inbox summary at 9am' or 'remind me to submit report Friday'.",
    );
  }

  const model = resolveAgentModelForTier(undefined, "primary");
  if (!model) {
    throw new Error(
      "Agent is not configured. Add GROQ_API_KEY or OPENAI_API_KEY to .env.",
    );
  }

  const capabilities = await getAgentCapabilities(userId);
  const connected = [
    capabilities.gmail ? "Gmail" : null,
    capabilities.googlecalendar ? "Google Calendar" : null,
  ].filter(Boolean);

  return generateJson(
    model,
    parsedTaskSchema,
    `You expand a short task hint into a complete, professional, execution-ready workspace task draft.
${nowContext()}
Connected tools: ${connected.length ? connected.join(", ") : "none"}.

JSON fields: title, description (REQUIRED — 2-4 sentences explaining goal and success criteria), type, priority, instructions (agent only — detailed steps), scheduleType, scheduleTime, scheduleDay, scheduledAt, dueAt, labels.

Rules:
- NEVER return a vague title like "Task" or "New task". Make it specific and action-oriented.
- description must be rich and professional — explain why, what, and expected outcome.
- For agent tasks, instructions must be step-by-step and mention which tools to use when relevant.
- Expand only from the hint provided — do not invent unrelated tasks.
- Infer schedule only when the hint implies timing; default daily at 09:00 for recurring agent tasks if time is unspecified.`,
    hint.trim(),
  );
}

/**
 * Turn a free-text instruction ("every weekday at 8am summarize my inbox")
 * into a structured task and create it.
 */
export async function createTaskFromText(
  userId: string,
  text: string,
): Promise<WorkspaceTask> {
  const model = resolveAgentModelForTier(undefined, "primary");
  if (!model) {
    throw new Error(
      "Agent is not configured. Add GROQ_API_KEY or OPENAI_API_KEY to .env.",
    );
  }

  const object = await generateJson(
    model,
    parsedTaskSchema,
    `You convert a user's natural-language request into a structured workspace task.
${nowContext()}

JSON fields: title (string), description (string, optional), type ("manual" | "agent"), priority ("low"|"normal"|"high"|"urgent"), instructions (string, agent only), scheduleType ("once"|"daily"|"weekly", agent only), scheduleTime ("HH:mm"), scheduleDay (0=Sun..6=Sat, weekly only), scheduledAt (ISO, once only), dueAt (ISO, manual only), labels (string[]).

Rules:
- If the request implies automation/recurring work the agent should do (e.g. "summarize my inbox every morning"), set type="agent" and write clear "instructions" describing what the agent must do each run.
- Otherwise set type="manual" (a simple to-do) and leave instructions empty.
- For agent tasks, infer scheduleType: "daily", "weekly" (set scheduleDay), or "once" (set scheduledAt as ISO).
- Use scheduleTime in 24h HH:mm. Default to "09:00" if a daily/weekly time isn't specified.
- Set dueAt (ISO) only for manual tasks with an explicit deadline.
- Infer 1-3 short lowercase labels when useful (e.g. "email", "report").
- Keep the title concise (max ~8 words).`,
    text.slice(0, 2000),
  );

  const isAgent = object.type === "agent";
  const scheduleType = isAgent ? object.scheduleType ?? "daily" : undefined;

  return createTask({
    userId,
    title: object.title,
    description: object.description,
    type: object.type,
    priority: object.priority,
    labels: object.labels,
    dueAt: !isAgent ? parseIso(object.dueAt) ?? null : null,
    instructions: isAgent ? object.instructions ?? object.title : undefined,
    scheduleType,
    scheduledAt:
      isAgent && scheduleType === "once" ? parseIso(object.scheduledAt) : undefined,
    scheduleTime:
      isAgent && scheduleType !== "once"
        ? object.scheduleTime ?? "09:00"
        : undefined,
    scheduleDay:
      isAgent && scheduleType === "weekly" ? object.scheduleDay ?? 1 : undefined,
    timezone: DEFAULT_TASK_TIMEZONE,
  });
}

const suggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(280).optional(),
        type: z.enum(["manual", "agent"]),
        instructions: z.string().max(600).optional(),
        scheduleType: z.enum(["once", "daily", "weekly"]).optional(),
        scheduleTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        reason: z.string().max(160),
      }),
    )
    .max(4),
});

export type TaskSuggestion = z.infer<
  typeof suggestionsSchema
>["suggestions"][number];

/** Suggest a few high-value tasks based on the user's connected tools. */
export async function suggestTasks(userId: string): Promise<TaskSuggestion[]> {
  const model = resolveAgentModelForTier(undefined, "primary");
  if (!model) return [];

  const capabilities = await getAgentCapabilities(userId);
  const connected = [
    capabilities.gmail ? "Gmail" : null,
    capabilities.googlecalendar ? "Google Calendar" : null,
  ].filter(Boolean);

  try {
    const object = await generateJson(
      model,
      suggestionsSchema,
      `You suggest up to 3 genuinely useful workspace automation tasks the user could create.
${nowContext()}
Connected tools: ${connected.length ? connected.join(", ") : "none"}.

JSON shape: { "suggestions": [ { "title": string, "description"?: string, "type": "manual"|"agent", "instructions"?: string, "scheduleType"?: "once"|"daily"|"weekly", "scheduleTime"?: "HH:mm", "reason": string } ] }

Rules:
- Prefer "agent" tasks that use the connected tools (e.g. daily inbox summary, end-of-day calendar brief).
- If no tools are connected, suggest simple manual to-dos to get started.
- Each suggestion needs a short "reason" explaining the value.
- Keep instructions concrete and actionable.`,
      "Suggest the most valuable tasks for this user right now. Be specific and practical.",
    );

    return object.suggestions;
  } catch (error) {
    console.warn("[tasks] suggestTasks failed:", error);
    return [];
  }
}
