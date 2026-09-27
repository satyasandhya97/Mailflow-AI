import { agentRouter } from "@/server/api/routers/agent";
import { authRouter } from "@/server/api/routers/auth";
import { calendarRouter } from "@/server/api/routers/calendar";
import { gmailRouter } from "@/server/api/routers/gmail";
import { integrationsRouter } from "@/server/api/routers/integrations";
import { tasksRouter } from "@/server/api/routers/tasks";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  gmail: gmailRouter,
  calendar: calendarRouter,
  agent: agentRouter,
  integrations: integrationsRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
