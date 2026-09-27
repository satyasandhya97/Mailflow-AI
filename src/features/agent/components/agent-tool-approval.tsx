"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getPendingToolApprovals,
  getToolApprovalCopy,
} from "@/features/agent/lib/agent-tool-ui";

type AgentToolApprovalProps = {
  message: UIMessage;
  onRespond: (approvalId: string, approved: boolean) => void;
  disabled?: boolean;
};

export function AgentToolApproval({
  message,
  onRespond,
  disabled = false,
}: AgentToolApprovalProps) {
  const pendingApprovals = getPendingToolApprovals(message);

  if (pendingApprovals.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {pendingApprovals.map((approval) => {
        const copy = getToolApprovalCopy(approval);

        return (
          <div
            key={approval.toolCallId}
            className="rounded-lg border border-destructive/25 bg-destructive/5 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {copy.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {copy.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={disabled}
                    onClick={() => onRespond(approval.approvalId, true)}
                  >
                    {copy.confirmLabel}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => onRespond(approval.approvalId, false)}
                  >
                    {copy.cancelLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function messageHasPendingToolApprovals(message: UIMessage): boolean {
  for (const part of message.parts) {
    if (!isToolUIPart(part)) continue;
    if (part.state === "approval-requested") return true;
  }

  return false;
}
