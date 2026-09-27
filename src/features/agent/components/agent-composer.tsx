"use client";

import type { ChatStatus } from "ai";
import { ArrowUp, Square } from "lucide-react";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { AgentModelSelector } from "@/features/agent/components/agent-model-selector";
import type { AgentModelOption } from "@/features/agent/types/agent.types";
import { cn } from "@/lib/utils";

type AgentComposerProps = {
  models: AgentModelOption[];
  modelKey: string;
  onModelChange: (key: string) => void;
  status: ChatStatus;
  onStop: () => void;
  onSubmit: (text: string) => void;
  disabled?: boolean;
};

const inputShellClassName = cn(
  "mx-auto block w-full max-w-3xl",
  "[&_[data-slot=input-group]]:h-auto",
  "[&_[data-slot=input-group]]:flex-col",
  "[&_[data-slot=input-group]]:items-stretch",
  "[&_[data-slot=input-group]]:rounded-[1.25rem]",
  "[&_[data-slot=input-group]]:border-border/50",
  "[&_[data-slot=input-group]]:bg-background",
  "[&_[data-slot=input-group]]:shadow-sm",
  "[&_[data-slot=input-group]]:transition-[box-shadow,border-color]",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:border-[var(--teal-700)]/25",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:shadow-md",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:ring-2",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:ring-[var(--teal-100)]",
);

export function AgentComposer({
  models,
  modelKey,
  onModelChange,
  status,
  onStop,
  onSubmit,
  disabled,
}: AgentComposerProps) {
  const isGenerating = status === "submitted" || status === "streaming";

  return (
    <div className="shrink-0 px-4 pb-5 pt-2">
      <PromptInput
        className={inputShellClassName}
        onSubmit={(message) => {
          const text = message.text.trim();
          if (!text || disabled) return;
          if (isGenerating) return;
          onSubmit(text);
        }}
      >
        <PromptInputBody>
          <PromptInputTextarea
            placeholder="Ask the agent to email or schedule…"
            disabled={disabled}
            className={cn(
              "min-h-16 resize-none border-0 bg-transparent px-4 py-3.5 text-sm leading-relaxed shadow-none",
              "placeholder:text-muted-foreground/70",
              "focus-visible:ring-0",
            )}
          />
        </PromptInputBody>

        <PromptInputFooter className="bg-muted/15 px-3 py-1">
          <PromptInputTools className="flex min-w-0 flex-1 items-center">
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger
                aria-label="Add attachments"
                variant="ghost"
                className="size-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>

          <div className="flex shrink-0 items-center gap-2">
            <AgentModelSelector
              models={models}
              modelKey={modelKey}
              onModelChange={onModelChange}
              disabled={disabled}
            />
            <PromptInputSubmit
              status={status}
              onStop={onStop}
              disabled={disabled}
              className={cn(
                "size-9 shrink-0 rounded-full shadow-none",
                !isGenerating && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {isGenerating ? (
                <Square className="size-3.5 fill-current" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </PromptInputSubmit>
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
