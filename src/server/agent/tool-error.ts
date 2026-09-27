/**
 * Converts a thrown tool error into a short, user-facing message.
 *
 * Agent tools should never crash the whole turn — instead they return this text
 * as their result so the model relays a clear explanation to the user.
 */
export function describeToolError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Corsair token decryption failed (corrupt token or CORSAIR_KEK changed).
  if (
    lower.includes("split is not a function") ||
    lower.includes("invalid encrypted") ||
    lower.includes("dek") ||
    lower.includes("decrypt")
  ) {
    return "Your Gmail/Calendar connection is broken (stored credentials could not be read). Please reconnect the plugin on the Plugins page.";
  }

  // Corsair raises this when an account is not connected yet.
  if (
    lower.includes("auth-missing") ||
    lower.includes("authentication required")
  ) {
    return "This integration isn't connected. Ask the user to connect it on the Plugins page.";
  }

  if (
    lower.includes("invalid recipient") ||
    lower.includes("invalid attendee")
  ) {
    return message;
  }

  if (
    lower.includes("not found") &&
    (lower.includes("integration") || lower.includes("account"))
  ) {
    return "This integration isn't set up yet. Ask the user to connect it on the Plugins page.";
  }

  return `The action could not be completed: ${message}`;
}

/**
 * Wraps a tool execute function so any thrown error is returned as a structured
 * result instead of bubbling up and failing the agent turn.
 */
export function safeToolExecute<TInput>(
  execute: (input: TInput) => Promise<string>,
): (input: TInput) => Promise<string> {
  return async (input: TInput) => {
    try {
      return await execute(input);
    } catch (error) {
      console.error("[agent/tool]", error);
      return JSON.stringify({ error: describeToolError(error) });
    }
  };
}
