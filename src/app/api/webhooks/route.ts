import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { corsair } from "@/server/integrations/corsair";
import { resolveWebhookTenantId } from "@/server/integrations/webhook-tenant";

function headersToRecord(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

export async function POST(request: NextRequest) {
  const headers = headersToRecord(request);
  const contentType = request.headers.get("content-type");

  let body: string | Record<string, unknown>;

  if (contentType?.includes("application/json")) {
    body = (await request.json()) as Record<string, unknown>;
  } else {
    const text = await request.text();
    body = text?.trim() ? text : {};
  }

  const tenantId = await resolveWebhookTenantId(body, headers);

  if (!tenantId) {
    console.warn("[webhooks] Could not resolve tenant for incoming webhook");
    return NextResponse.json(
      {
        success: false,
        message: "Could not resolve tenant for webhook",
      },
      { status: 400 },
    );
  }

  const result = await processWebhook(corsair, headers, body, { tenantId });

  console.info("Webhook processed:", {
    plugin: result.plugin,
    action: result.action,
    tenantId,
  });

  const responseHeaders = result.responseHeaders;
  const nextHeaders = new Headers();
  if (responseHeaders) {
    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, value);
    }
  }

  if (!result.response) {
    return NextResponse.json(
      {
        success: false,
        message: "No matching webhook handler found",
      },
      { status: 404 },
    );
  }

  if (result.response !== undefined) {
    return NextResponse.json(result.response, { headers: nextHeaders });
  }

  return new NextResponse(null, { status: 200, headers: nextHeaders });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
