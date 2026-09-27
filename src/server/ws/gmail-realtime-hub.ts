import type { IncomingMessage, Server as HttpServer } from "node:http";
import { parse as parseUrl } from "node:url";

import { WebSocket, WebSocketServer } from "ws";

import { getSessionTokenFromHeader } from "@/server/auth/parse-session-cookie";
import { resolveSessionFromToken } from "@/server/auth/resolve-session";
import { GMAIL_WS_PATH } from "@/features/gmail/lib/gmail-realtime.constants";

export { GMAIL_WS_PATH };

export type GmailRealtimeEvent = {
  type: "gmail.inbox.updated";
  at: string;
};

type GmailRealtimeHubState = {
  hub?: GmailRealtimeHub;
  wss?: WebSocketServer;
  heartbeat?: ReturnType<typeof setInterval>;
};

const globalForWs = globalThis as typeof globalThis & {
  __gmailRealtime?: GmailRealtimeHubState;
};

class GmailRealtimeHub {
  private readonly connections = new Map<string, Set<WebSocket>>();

  subscribe(userId: string, ws: WebSocket) {
    const existing = this.connections.get(userId) ?? new Set<WebSocket>();
    existing.add(ws);
    this.connections.set(userId, existing);
  }

  unsubscribe(userId: string, ws: WebSocket) {
    const existing = this.connections.get(userId);
    if (!existing) return;

    existing.delete(ws);
    if (existing.size === 0) {
      this.connections.delete(userId);
    }
  }

  broadcastInboxUpdated(userId: string) {
    const sockets = this.connections.get(userId);
    if (!sockets || sockets.size === 0) return;

    const payload: GmailRealtimeEvent = {
      type: "gmail.inbox.updated",
      at: new Date().toISOString(),
    };
    const message = JSON.stringify(payload);

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}

function getState(): GmailRealtimeHubState {
  globalForWs.__gmailRealtime ??= {};
  return globalForWs.__gmailRealtime;
}

export function getGmailRealtimeHub(): GmailRealtimeHub {
  const state = getState();
  state.hub ??= new GmailRealtimeHub();
  return state.hub;
}

async function authenticateUpgrade(request: IncomingMessage): Promise<string | null> {
  const token = getSessionTokenFromHeader(request.headers.cookie ?? null);
  const session = await resolveSessionFromToken(token);
  return session?.user.id ?? null;
}

function startHeartbeat(wss: WebSocketServer) {
  const state = getState();
  if (state.heartbeat) return;

  state.heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }

      ws.isAlive = false;
      ws.ping();
    }
  }, 30_000);
}

export function attachGmailRealtimeWebSocket(server: HttpServer) {
  const state = getState();
  if (state.wss) return state.wss;

  const wss = new WebSocketServer({ noServer: true });
  const hub = getGmailRealtimeHub();

  server.on("upgrade", (request, socket, head) => {
    void (async () => {
      const { pathname } = parseUrl(request.url ?? "");
      if (pathname !== GMAIL_WS_PATH) {
        socket.destroy();
        return;
      }

      const userId = await authenticateUpgrade(request);
      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.isAlive = true;
        ws.on("pong", () => {
          ws.isAlive = true;
        });

        hub.subscribe(userId, ws);

        ws.send(
          JSON.stringify({
            type: "gmail.connected",
            at: new Date().toISOString(),
          } satisfies { type: string; at: string }),
        );

        ws.on("close", () => {
          hub.unsubscribe(userId, ws);
        });

        wss.emit("connection", ws, request);
      });
    })().catch((error) => {
      console.error("[gmail/ws] upgrade failed:", error);
      socket.destroy();
    });
  });

  startHeartbeat(wss);
  state.wss = wss;
  return wss;
}

declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}
