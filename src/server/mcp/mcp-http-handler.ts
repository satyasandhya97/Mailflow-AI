import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { randomUUID } from "crypto";

import { getTenantForUser } from "@/server/integrations/tenant";
import { resolveMcpTenantId } from "@/server/mcp/resolve-mcp-auth";

type McpSession = {
  server: McpServer;
  transport: WebStandardStreamableHTTPServerTransport;
  tenantId: string;
};

const sessions = new Map<string, McpSession>();

function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;

  void session.transport.close();
  void session.server.close();
  sessions.delete(sessionId);
}

async function createTenantMcpSession(tenantId: string) {
  const { createBaseMcpServer } = await import("@corsair-dev/mcp");

  const server = createBaseMcpServer({
    corsair: getTenantForUser(tenantId),
    setup: false,
    tenantId,
  });

  let sessionId = "";

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessionId = id;
      sessions.set(id, { server, transport, tenantId });
    },
    onsessionclosed: (id) => {
      cleanupSession(id);
    },
  });

  await server.connect(transport);

  return { server, transport, sessionId };
}

export async function handleMcpHttpRequest(
  request: Request,
): Promise<Response> {
  const tenantId = await resolveMcpTenantId(request);
  if (!tenantId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = request.headers.get("mcp-session-id");

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return session.transport.handleRequest(request);
  }

  const { transport } = await createTenantMcpSession(tenantId);
  return transport.handleRequest(request);
}

export async function handleMcpHttpDelete(
  request: Request,
): Promise<Response> {
  const tenantId = await resolveMcpTenantId(request);
  if (!tenantId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = request.headers.get("mcp-session-id");
  if (sessionId) {
    cleanupSession(sessionId);
  }

  return new Response(null, { status: 200 });
}
