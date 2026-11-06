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
  "[&_[data-slot=input-group]]:rounded-2xl",
  "[&_[data-slot=input-group]]:border",
  "[&_[data-slot=input-group]]:border-border/70",
  "[&_[data-slot=input-group]]:bg-[#18181b]",
  "[&_[data-slot=input-group]]:shadow-lg",
  "[&_[data-slot=input-group]]:shadow-black/25",
  "[&_[data-slot=input-group]]:overflow-hidden",
  "[&_[data-slot=input-group]]:transition-all",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:border-[var(--teal-600)]/60",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:shadow-xl",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:ring-2",
  "[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:ring-[var(--teal-600)]/20",
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
        <div className="bg-[#18181b] px-4 pt-3.5 pb-2">
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask the agent to email or schedule…"
              disabled={disabled}
              className={cn(
                "min-h-16 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none text-foreground",
                "placeholder:text-muted-foreground/65",
                "focus-visible:ring-0",
              )}
            />
          </PromptInputBody>
        </div>

        <PromptInputFooter className="bg-[#242429] border-t border-border/50 px-3.5 py-2.5 flex items-center justify-between">
          <PromptInputTools className="flex min-w-0 flex-1 items-center gap-1.5">
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger
                aria-label="Add attachments"
                variant="ghost"
                className="size-8 rounded-full bg-background/60 hover:bg-background border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
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
                "size-8.5 shrink-0 rounded-full shadow-xs font-semibold transition-all hover:scale-105 active:scale-95",
                !isGenerating
                  ? "bg-[var(--teal-600)] text-[#0d1205] hover:bg-[var(--teal-500)]"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {isGenerating ? (
                <Square className="size-3.5 fill-current" />
              ) : (
                <ArrowUp className="size-4 stroke-[2.5]" />
              )}
            </PromptInputSubmit>
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
