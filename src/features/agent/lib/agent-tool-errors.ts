const RETRIABLE_PATTERNS = [
  "failed to call a function",
  "failed_generation",
  "tool_use_failed",
  "model_decommissioned",
  "decommissioned",
  "model_not_found",
  "invalid_request_error",
  "rate limit",
  "rate_limit_exceeded",
  "request too large",
  "tokens per minute",
  "retried with fallback",
] as const;

export function isAgentRetriableErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return RETRIABLE_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function formatAgentErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower === "an error occurred." || lower === "an error occurred") {
    return "The model request failed unexpectedly. Try again, switch models, or start a new chat.";
  }

  if (lower.includes("model_decommissioned") || lower.includes("decommissioned")) {
    return "The selected Groq model is no longer available. Retrying with a fallback model, or pick **GPT-OSS 120B** / **GPT-4o Mini** in the model menu.";
  }

  if (lower.includes("failed to call a function") || lower.includes("tool_use_failed") || lower.includes("failed_generation")) {
    return "Groq could not format a tool call (often from old chat history). Start a **new chat**, use **Llama 3.3 70B**, or switch to **GPT-4o Mini**.";
  }

  if (lower.includes("reasoning") && lower.includes("not supported")) {
    return "This chat includes **GPT-OSS reasoning** history, which **Llama 3.3 70B** cannot read. Start a **new chat** or switch back to **GPT-OSS 120B**.";
  }

  if (
    lower.includes("insufficient_quota") ||
    lower.includes("credit_balance_exhausted") ||
    lower.includes("no credits remaining") ||
    lower.includes("billing")
  ) {
    return "OpenAI API credit limit reached or no credits remaining. Please add credits at platform.openai.com/settings/organization/billing or switch to a free Groq / Gemini API key.";
  }

  if (lower.includes("invalid api key") || lower.includes("incorrect api key")) {
    return "Invalid API key for the selected provider. Check your `.env` and restart the dev server.";
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("413") ||
    lower.includes("tokens per minute") ||
    lower.includes("request too large") ||
    lower.includes("rate_limit_exceeded")
  ) {
    return "Rate or context limit reached for this provider. Try switching to a different model or provider in the model menu.";
  }

  return message;
}
