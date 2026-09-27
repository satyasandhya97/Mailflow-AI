import "dotenv/config";

import { createServer, type IncomingMessage } from "node:http";
import { parse as parseUrl } from "node:url";

import { env } from "@/env";
import { GMAIL_WS_PATH } from "@/features/gmail/lib/gmail-realtime.constants";
import {
  attachGmailRealtimeWebSocket,
  getGmailRealtimeHub,
} from "@/server/ws/gmail-realtime-hub";

const port = Number(process.env.GMAIL_WS_PORT ?? 3001);

function isAuthorizedInternal(req: IncomingMessage): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const secret = env.AGENT_MCP_INTERNAL_SECRET;
  if (!secret) return false;

  return req.headers["x-internal-secret"] === secret;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const text = Buffer.concat(chunks).toString("utf-8");
  return text ? JSON.parse(text) : {};
}

const server = createServer((req, res) => {
  void (async () => {
    const { pathname } = parseUrl(req.url ?? "", true);

    if (req.method === "POST" && pathname === "/internal/broadcast") {
      if (!isAuthorizedInternal(req)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      try {
        const body = (await readJsonBody(req)) as { userId?: string };
        if (!body.userId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "userId required" }));
          return;
        }

        getGmailRealtimeHub().broadcastInboxUpdated(body.userId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error("[gmail/ws-server] broadcast failed:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Broadcast failed" }));
      }
      return;
    }

    if (req.method === "GET" && pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", path: GMAIL_WS_PATH }));
      return;
    }

    res.writeHead(404);
    res.end();
  })();
});

attachGmailRealtimeWebSocket(server);

server.listen(port, () => {
  console.info(
    `[gmail/ws-server] listening on ws://localhost:${port}${GMAIL_WS_PATH}`,
  );
});
