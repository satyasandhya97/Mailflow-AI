import { APICallError } from "ai";

import { formatAgentErrorMessage } from "@/features/agent/lib/agent-tool-errors";

function parseApiErrorBody(responseBody: string | undefined): string | null {
  if (!responseBody) return null;

  try {
    const parsed = JSON.parse(responseBody) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message ?? parsed.message ?? null;
  } catch {
    return null;
  }
}

export function extractAgentErrorMessage(error: unknown): string {
  let raw = "Something went wrong while generating a response.";

  if (APICallError.isInstance(error)) {
    raw =
      parseApiErrorBody(error.responseBody) ??
      error.message ??
      raw;
  } else if (error instanceof Error && error.message.trim()) {
    raw = error.message;
  }

  return formatAgentErrorMessage(raw);
}
