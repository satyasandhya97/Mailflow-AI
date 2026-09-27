import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/server/integrations/corsair-automation";
import { sendDueScheduledEmails } from "@/server/services/scheduled-email.service";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueScheduledEmails();

  return NextResponse.json({
    ok: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
