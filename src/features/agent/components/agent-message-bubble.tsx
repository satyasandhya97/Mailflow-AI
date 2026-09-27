"use client";

import type { UIMessage } from "ai";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";
import { AgentToolApproval } from "@/features/agent/components/agent-tool-approval";
import {
  getPendingToolApprovals,
  getVisibleToolParts,
} from "@/features/agent/lib/agent-tool-ui";
import { getMessageText } from "@/features/agent/lib/agent-message-utils";

type AgentMessageBubbleProps = {
  message: UIMessage;
  isAnimating?: boolean;
  onToolApproval?: (approvalId: string, approved: boolean) => void;
  approvalDisabled?: boolean;
};

export function AgentMessageBubble({
  message,
  isAnimating,
  onToolApproval,
  approvalDisabled = false,
}: AgentMessageBubbleProps) {
  const text = getMessageText(message.parts);
  const toolParts = getVisibleToolParts(message);

  if (
    message.role === "assistant" &&
    !text &&
    toolParts.length === 0 &&
    getPendingToolApprovals(message).length === 0
  ) {
    return null;
  }

  return (
    <Message from={message.role}>
      <MessageContent className="gap-3">
        {onToolApproval ? (
          <AgentToolApproval
            message={message}
            disabled={approvalDisabled}
            onRespond={onToolApproval}
          />
        ) : null}

        {toolParts.map((part: ToolPart) => (
          <Tool key={part.toolCallId} defaultOpen={part.state === "output-error"}>
            {part.type === "dynamic-tool" ? (
              <ToolHeader
                type={part.type}
                state={part.state}
                toolName={part.toolName}
                title="Something went wrong"
              />
            ) : (
              <ToolHeader
                type={part.type}
                state={part.state}
                title="Something went wrong"
              />
            )}
            <ToolContent>
              {"input" in part && part.input !== undefined ? (
                <ToolInput input={part.input} />
              ) : null}
              <ToolOutput output={part.output} errorText={part.errorText} />
            </ToolContent>
          </Tool>
        ))}

        {text ? (
          message.role === "assistant" ? (
            <MessageResponse isAnimating={isAnimating}>{text}</MessageResponse>
          ) : (
            <p className="whitespace-pre-wrap">{text}</p>
          )
        ) : null}
      </MessageContent>
    </Message>
  );
}
