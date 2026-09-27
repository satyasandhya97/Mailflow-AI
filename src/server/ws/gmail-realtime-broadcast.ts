import { env } from "@/env";

const DEFAULT_WS_PORT = 3001;

function getWsInternalUrl(): string {
  const port = process.env.GMAIL_WS_PORT ?? String(DEFAULT_WS_PORT);
  return `http://127.0.0.1:${port}/internal/broadcast`;
}

/**
 * Notify connected Gmail WebSocket clients for a user.
 * Posts to the standalone ws-server (dev) and/or uses the in-process hub (production server.ts).
 */
export async function broadcastGmailInboxUpdated(userId: string): Promise<void> {
  try {
    const { getGmailRealtimeHub } = await import(
      "@/server/ws/gmail-realtime-hub"
    );
    getGmailRealtimeHub().broadcastInboxUpdated(userId);
  } catch {
    // In-process hub not attached (next dev only).
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (env.AGENT_MCP_INTERNAL_SECRET) {
      headers["x-internal-secret"] = env.AGENT_MCP_INTERNAL_SECRET;
    }

    await fetch(getWsInternalUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({ userId }),
    });
  } catch {
    // WS server may be offline.
  }
}
