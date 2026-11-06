import { type ToolSet } from "ai";

import { buildCalendarAgentTools } from "@/server/agent/calendar-agent-tools";
import { buildCorsairMcpAgentTools } from "@/server/agent/corsair-mcp-tools";
import { buildGmailAgentTools } from "@/server/agent/gmail-agent-tools";
import {
  getAgentCapabilities,
  type AgentCapabilities,
} from "@/server/services/plugin-settings.service";

export type CorsairAiToolsOptions = {
  capabilities?: AgentCapabilities;
  onCalendarSynced?: () => void;
};

export async function createCorsairAiTools(
  userId: string,
  options: CorsairAiToolsOptions = {},
): Promise<ToolSet> {
  const capabilities =
    options.capabilities ?? (await getAgentCapabilities(userId));

  return {
    ...(capabilities.gmail ? buildGmailAgentTools({ userId }) : {}),
    ...(capabilities.googlecalendar
      ? buildCalendarAgentTools({
          userId,
          onCalendarSynced: options.onCalendarSynced,
        })
      : {}),
    ...buildCorsairMcpAgentTools(userId),
  };
}
