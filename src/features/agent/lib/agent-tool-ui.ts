import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";
import { isToolUIPart } from "ai";

export type VisibleToolPart = ToolUIPart | DynamicToolUIPart;

export type PendingToolApproval = {
  toolCallId: string;
  toolName: string;
  approvalId: string;
  input: Record<string, unknown>;
};

/** Internal / low-level tools — hidden from chat UI on success. */
const HIDDEN_TOOL_NAMES = new Set([
  "create_calendar_event",
  "list_calendar_events",
  "delete_calendar_events",
  "list_gmail_messages",
  "get_gmail_message",
  "send_gmail_email",
  "schedule_gmail_email",
  "corsair_setup",
  "list_workspace_tasks",
  "get_workspace_task",
  "prepare_task_draft",
  "create_workspace_task",
  "update_workspace_task",
  "update_workspace_task_status",
  "preview_task_next_run",
  "run_workspace_task",
]);

const TASK_MUTATION_TOOL_NAMES = new Set([
  "create_workspace_task",
  "update_workspace_task",
  "update_workspace_task_status",
  "delete_workspace_task",
  "run_workspace_task",
]);

export function getToolDisplayName(part: {
  type: string;
  toolName?: string;
}): string {
  if (part.type === "dynamic-tool" && part.toolName) {
    return part.toolName;
  }
  return part.type.replace(/^tool-/, "");
}

export function shouldShowToolPart(part: {
  type: string;
  state: string;
  toolName?: string;
}): boolean {
  const name = getToolDisplayName(part);
  if (part.state === "output-error") return true;
  if (HIDDEN_TOOL_NAMES.has(name)) return false;
  return false;
}

export function getVisibleToolParts(message: UIMessage): VisibleToolPart[] {
  const visible: VisibleToolPart[] = [];

  for (const part of message.parts) {
    if (!isToolUIPart(part)) continue;
    if (
      shouldShowToolPart(part)
    ) {
      visible.push(part);
    }
  }

  return visible;
}

export function getPendingToolApprovals(
  message: UIMessage,
): PendingToolApproval[] {
  const pending: PendingToolApproval[] = [];

  for (const part of message.parts) {
    if (!isToolUIPart(part)) continue;
    if (part.state !== "approval-requested") continue;
    if (!("approval" in part) || !part.approval?.id) continue;

    pending.push({
      toolCallId: part.toolCallId,
      toolName: getToolDisplayName(part),
      approvalId: part.approval.id,
      input:
        "input" in part && part.input && typeof part.input === "object"
          ? (part.input as Record<string, unknown>)
          : {},
    });
  }

  return pending;
}

export function getToolApprovalCopy(approval: PendingToolApproval): {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
} {
  if (approval.toolName === "delete_workspace_task") {
    const taskId =
      typeof approval.input.taskId === "string"
        ? approval.input.taskId
        : "this task";

    return {
      title: "Delete this task?",
      description: `Task ${taskId} will be permanently removed. This cannot be undone.`,
      confirmLabel: "Confirm Delete",
      cancelLabel: "Cancel",
    };
  }

  return {
    title: "Approve this action?",
    description: "The agent is waiting for your confirmation.",
    confirmLabel: "Approve",
    cancelLabel: "Cancel",
  };
}

const CALENDAR_TOOL_NAMES = new Set([
  "create_calendar_event",
  "delete_calendar_events",
  "list_calendar_events",
]);

const GMAIL_MUTATION_TOOL_NAMES = new Set([
  "send_gmail_email",
  "schedule_gmail_email",
]);

const GMAIL_LIST_TOOL_NAMES = new Set([
  "list_gmail_messages",
  "get_gmail_message",
]);

const CALENDAR_SCRIPT_PATTERN =
  /googlecalendar\.api\.events\.(create|update|delete)\b/i;

export function scriptTouchesCalendarMutation(code: string): boolean {
  return CALENDAR_SCRIPT_PATTERN.test(code);
}

export function messagesTouchCalendarMutation(messages: UIMessage[]): boolean {
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;

      const name = getToolDisplayName(part);

      if (CALENDAR_TOOL_NAMES.has(name)) return true;

      if (part.type === "tool-run_script") {
        const code =
          "input" in part &&
          part.input &&
          typeof part.input === "object" &&
          "code" in part.input &&
          typeof part.input.code === "string"
            ? part.input.code
            : "";

        if (code && scriptTouchesCalendarMutation(code)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function messagesTouchGmailMutation(messages: UIMessage[]): boolean {
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;

      const name = getToolDisplayName(part);

      if (GMAIL_MUTATION_TOOL_NAMES.has(name)) return true;
    }
  }

  return false;
}

export function messagesTouchGmailList(messages: UIMessage[]): boolean {
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;

      const name = getToolDisplayName(part);

      if (GMAIL_LIST_TOOL_NAMES.has(name)) return true;
    }
  }

  return false;
}

export function messagesTouchTaskMutation(messages: UIMessage[]): boolean {
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;
      if (part.state !== "output-available") continue;

      const name = getToolDisplayName(part);

      if (TASK_MUTATION_TOOL_NAMES.has(name)) return true;
    }
  }

  return false;
}
