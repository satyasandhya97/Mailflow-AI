import { type ToolSet } from "ai";

import { buildCalendarAgentTools } from "@/server/agent/calendar-agent-tools";
import { buildCorsairMcpAgentTools } from "@/server/agent/corsair-mcp-tools";
import { buildGmailAgentTools } from "@/server/agent/gmail-agent-tools";
import { buildTaskAgentTools } from "@/server/agent/task-agent-tools";
import {
  getAgentCapabilities,
  type AgentCapabilities,
} from "@/server/services/plugin-settings.service";

export type CorsairAiToolsOptions = {
  capabilities?: AgentCapabilities;
  onCalendarSynced?: () => void;
  /** Include workspace task management tools (create/list/update/run). */
  includeTaskTools?: boolean;
  /** Allow run_workspace_task. Disabled inside background task runs to avoid recursion. */
  allowTaskRun?: boolean;
};

export async function createCorsairAiTools(
  userId: string,
  options: CorsairAiToolsOptions = {},
): Promise<ToolSet> {
  const capabilities =
    options.capabilities ?? (await getAgentCapabilities(userId));

  const includeTaskTools = options.includeTaskTools ?? true;

  return {
    ...(capabilities.gmail ? buildGmailAgentTools({ userId }) : {}),
    ...(capabilities.googlecalendar
      ? buildCalendarAgentTools({
          userId,
          onCalendarSynced: options.onCalendarSynced,
        })
      : {}),
    ...(includeTaskTools
      ? buildTaskAgentTools({ userId, allowRun: options.allowTaskRun ?? true })
      : {}),
    ...buildCorsairMcpAgentTools(userId),
  };
}
