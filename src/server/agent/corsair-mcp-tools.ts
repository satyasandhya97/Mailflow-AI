import { setupCorsair } from "corsair";
import { tool, type ToolSet } from "ai";
import { z } from "zod";

import { getTenantForUser } from "@/server/integrations/tenant";

/**
 * In-process Corsair setup tool only.
 * Avoid importing `@corsair-dev/mcp` here — its bundle pulls Express and breaks Next.js/Turbopack.
 */
export function buildCorsairMcpAgentTools(userId: string): ToolSet {
  const tenant = getTenantForUser(userId);

  return {
    corsair_setup: tool({
      description:
        "Check whether Gmail/Google Calendar plugins need OAuth or keys. Use when integrations fail or the user asks to connect plugins.",
      inputSchema: z.object({
        tenantId: z
          .string()
          .optional()
          .describe("Tenant ID — defaults to the current user"),
      }),
      execute: async (input) => {
        try {
          const setupTenantId =
            typeof input.tenantId === "string" && input.tenantId.length > 0
              ? input.tenantId
              : userId;

          const text = await setupCorsair(tenant as never, {
            tenantId: setupTenantId,
          });

          return text || "Corsair setup complete.";
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(`Setup failed: ${message}`);
        }
      },
    }),
  };
}
