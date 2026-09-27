import {
  handleMcpHttpDelete,
  handleMcpHttpRequest,
} from "@/server/mcp/mcp-http-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleMcpHttpRequest(request);
}

export async function GET(request: Request) {
  return handleMcpHttpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpHttpDelete(request);
}
