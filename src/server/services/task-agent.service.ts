import { generateText, stepCountIs } from "ai";
import { eq } from "drizzle-orm";

import { buildAgentSystemPrompt } from "@/server/agent/build-agent-system-prompt";
import { createCorsairAiTools } from "@/server/agent/corsair-tools";
import { resolveAgentModelForTier } from "@/server/agent/resolve-agent-model";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { searchUserMemories } from "@/server/services/agent-mem0.service";
import { sendTaskResultEmail } from "@/server/services/email.service";
import { getAgentCapabilities } from "@/server/services/plugin-settings.service";
import type { WorkspaceTask } from "@/features/tasks/types/task.types";
import {
  completeAgentTaskRun,
  createTaskRun,
  finishTaskRun,
  getTaskForUser,
  claimTaskForRun,
} from "@/server/services/task.service";

const AGENT_MAX_TOOL_STEPS = 10;

export async function runAgentTask(
  userId: string,
  instructions: string,
): Promise<string> {
  const model = resolveAgentModelForTier(undefined, "primary");

  if (!model) {
    throw new Error(
      "Agent is not configured. Add GROQ_API_KEY or OPENAI_API_KEY to .env.",
    );
  }

  const [capabilities, memories, user] = await Promise.all([
    getAgentCapabilities(userId),
    searchUserMemories(userId, instructions),
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
  ]);

  const tools = await createCorsairAiTools(userId, {
    capabilities,
    includeTaskTools: false,
  });

  const result = await generateText({
    model,
    system: `${buildAgentSystemPrompt({
      memories,
      userName: user?.fullName,
      capabilities,
    })}

## Automated background task
You are executing a scheduled workspace task without the user present.
Complete the instruction below using your tools when needed.
Report clearly what you did, what you found, and any follow-up the user should know.`,
    prompt: instructions,
    tools,
    stopWhen: stepCountIs(AGENT_MAX_TOOL_STEPS),
  });

  const text = result.text.trim();

  if (!text) {
    throw new Error("Agent completed without a response.");
  }

  return text;
}

/**
 * Full lifecycle execution of one agent task: mark running, record a run,
 * call the agent, then persist success/failure. Shared by the manual
 * "Run now" action and the agent's own run_task tool.
 */
export async function runTaskById(
  userId: string,
  taskId: string,
): Promise<{ output: string; task: WorkspaceTask }> {
  const task = await getTaskForUser(userId, taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  if (task.type !== "agent") {
    throw new Error("Only agent tasks can be executed.");
  }

  if (!task.instructions?.trim()) {
    throw new Error("Task is missing instructions.");
  }

  const claimed = await claimTaskForRun(task.id);
  if (!claimed) {
    const current = await getTaskForUser(userId, taskId);
    if (current?.status === "in_progress") {
      return { output: current.lastRunOutput ?? "", task: current };
    }
    throw new Error("Task is not available to run.");
  }

  const runId = await createTaskRun(task.id);

  try {
    const output = await runAgentTask(userId, task.instructions);
    await finishTaskRun({ runId, status: "success", output });
    await completeAgentTaskRun({ taskId: task.id, success: true, output });

    if (task.outputDelivery === "email") {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (owner?.email) {
        await sendTaskResultEmail({
          email: owner.email,
          taskTitle: task.title,
          output,
        });
      }
    }

    const updated = await getTaskForUser(userId, taskId);
    if (!updated) throw new Error("Task not found after run.");

    return { output, task: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishTaskRun({ runId, status: "failed", error: message });
    await completeAgentTaskRun({
      taskId: task.id,
      success: false,
      error: message,
    });

    const updated = await getTaskForUser(userId, taskId);
    if (updated) {
      throw new Error(message);
    }
    throw new Error(message);
  }
}
