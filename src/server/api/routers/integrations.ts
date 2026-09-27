import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  getPluginConnectionStatus,
  getPluginConnectionStatuses,
  OAUTH_PLUGIN_IDS,
  startOAuth,
} from "@/server/services/integrations.service";
import {
  getAgentCapabilities,
  getUserPluginSettingsRecord,
  syncUserPluginSettings,
} from "@/server/services/plugin-settings.service";

const pluginSettingsSchema = z.object({
  enabled: z.boolean(),
  agentAccess: z.boolean(),
});

export const integrationsRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(
      z.object({
        pluginIds: z.array(z.string().min(1)).min(1),
      }),
    )
    .query(({ ctx, input }) =>
      getPluginConnectionStatuses(ctx.session.user.id, input.pluginIds),
    ),

  getPluginStatus: protectedProcedure
    .input(z.object({ pluginId: z.enum(OAUTH_PLUGIN_IDS) }))
    .query(({ ctx, input }) =>
      getPluginConnectionStatus(ctx.session.user.id, input.pluginId),
    ),

  startOAuth: protectedProcedure
    .input(
      z.object({
        pluginId: z.enum(OAUTH_PLUGIN_IDS),
      }),
    )
    .mutation(({ ctx, input }) =>
      startOAuth(ctx.session.user.id, input.pluginId),
    ),

  getAgentCapabilities: protectedProcedure.query(({ ctx }) =>
    getAgentCapabilities(ctx.session.user.id),
  ),

  getPluginSettings: protectedProcedure.query(({ ctx }) =>
    getUserPluginSettingsRecord(ctx.session.user.id),
  ),

  syncPluginSettings: protectedProcedure
    .input(
      z.object({
        installedIds: z.array(z.string().min(1)),
        settings: z.record(z.string(), pluginSettingsSchema),
      }),
    )
    .mutation(({ ctx, input }) =>
      syncUserPluginSettings(ctx.session.user.id, input),
    ),
});
