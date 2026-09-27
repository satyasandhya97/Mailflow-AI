import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/server/integrations/corsair-automation";
import {
  ensureTaskScheduler,
  runDueAgentTasks,
} from "@/server/services/task-scheduler.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureTaskScheduler();
  const result = await runDueAgentTasks();

  return NextResponse.json({
    ok: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

// Vercel Cron invokes the endpoint with GET + `Authorization: Bearer <secret>`.
export async function GET(request: Request) {
  return handle(request);
}

// Manual / external schedulers can POST with the same bearer secret.
export async function POST(request: Request) {
  return handle(request);
}
