"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

type AgentTypingIndicatorProps = {
  label?: string;
  className?: string;
};

export function AgentTypingIndicator({
  label = "Agent is typing",
  className,
}: AgentTypingIndicatorProps) {
  return (
    <Message from="assistant" className={className}>
      <MessageContent>
        <div
          className="flex items-center gap-1 px-1 py-0.5"
          role="status"
          aria-live="polite"
          aria-label={label}
        >
          <span className="sr-only">{label}</span>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn(
                "size-2 rounded-full bg-muted-foreground/50 animate-bounce",
              )}
              style={{ animationDelay: `${index * 150}ms` }}
            />
          ))}
        </div>
      </MessageContent>
    </Message>
  );
}
