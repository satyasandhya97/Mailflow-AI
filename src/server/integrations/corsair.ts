import "dotenv/config";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";

import { env } from "@/env";
import { conn } from "@/server/db";
import {
  applyCalendarEventDefaults,
  extractTenantIdFromHookContext,
  handleCalendarEventChangedWebhook,
  handleGmailMessageChangedWebhook,
  validateGmailSendArgs,
} from "@/server/integrations/corsair-automation";
import {
  pluginErrorHandlers,
  rootErrorHandlers,
} from "@/server/integrations/corsair-error-handlers";

export const corsair = createCorsair({
  plugins: [
    gmail({
      errorHandlers: pluginErrorHandlers,
      hooks: {
        messages: {
          send: {
            before(_ctx, args) {
              validateGmailSendArgs(args);
              return { ctx: _ctx, args };
            },
            after(ctx, result) {
              const tenantId = extractTenantIdFromHookContext(ctx);
              console.info("[gmail hook] message sent", {
                tenantId,
                messageId:
                  result && typeof result === "object" && "id" in result
                    ? result.id
                    : undefined,
              });
            },
          },
        },
      },
      webhookHooks: {
        messageChanged: {
          after(ctx, response) {
            const tenantId = extractTenantIdFromHookContext(ctx);
            if (!tenantId) {
              console.warn("[gmail webhook] missing tenantId");
              return;
            }

            void handleGmailMessageChangedWebhook(tenantId, response).catch(
              (error) => {
                console.warn("[gmail webhook] automation failed:", error);
              },
            );
          },
        },
      },
    }),
    googlecalendar({
      errorHandlers: pluginErrorHandlers,
      hooks: {
        events: {
          create: {
            before(ctx, args) {
              return {
                ctx,
                args: applyCalendarEventDefaults(args),
              };
            },
            after(ctx, result) {
              const tenantId = extractTenantIdFromHookContext(ctx);
              console.info("[calendar hook] event created", {
                tenantId,
                eventId:
                  result && typeof result === "object" && "id" in result
                    ? result.id
                    : undefined,
              });
            },
          },
        },
      },
      webhookHooks: {
        onEventChanged: {
          after(ctx, response) {
            const tenantId = extractTenantIdFromHookContext(ctx);
            if (!tenantId) {
              console.warn("[calendar webhook] missing tenantId");
              return;
            }

            void handleCalendarEventChangedWebhook(tenantId, response).catch(
              (error) => {
                console.warn("[calendar webhook] automation failed:", error);
              },
            );
          },
        },
      },
    }),
  ],
  database: conn,
  kek: env.CORSAIR_KEK,
  multiTenancy: true,
  errorHandlers: rootErrorHandlers,
  connect: {
    baseUrl: `${env.APP_URL}/plugins`,
    redirectUri: env.OAUTH_REDIRECT_URI,
  },
});
