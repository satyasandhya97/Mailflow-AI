import "dotenv/config";

import { createServer } from "node:http";
import { parse as parseUrl } from "node:url";

import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const { attachGmailRealtimeWebSocket } = await import(
  "./src/server/ws/gmail-realtime-hub"
);

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parseUrl(req.url ?? "", true);
    await handle(req, res, parsedUrl);
  } catch (error) {
    console.error("[server] request failed:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

attachGmailRealtimeWebSocket(server);

const { startTaskScheduler } = await import(
  "./src/server/services/task-scheduler.service"
);
startTaskScheduler();

server.listen(port, () => {
  console.info(
    `[server] ready on http://${hostname}:${port} (unified ws: ws://${hostname}:${port}/api/ws/gmail)`,
  );
  console.info(
    "[server] set NEXT_PUBLIC_GMAIL_WS_SAME_ORIGIN=true for client WebSocket URL",
  );
});
