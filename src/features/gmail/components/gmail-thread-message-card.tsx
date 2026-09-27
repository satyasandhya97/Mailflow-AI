"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatMessageDate,
  formatSender,
  LinkifiedText,
} from "@/features/gmail/lib/display";
import {
  getSenderDisplayName,
  getSenderInitials,
} from "@/features/gmail/lib/gmail-ui.utils";
import type { EmailMessage } from "@/features/gmail/types";

type GmailThreadMessageCardProps = {
  email: EmailMessage;
  expanded: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
};

export function GmailThreadMessageCard({
  email,
  expanded,
  onToggle,
  isHighlighted = false,
}: GmailThreadMessageCardProps) {
  const sender = getSenderDisplayName(email.from);

  return (
    <article
      className={cn(
        "border-b border-border/50 last:border-b-0",
        isHighlighted && "bg-[var(--teal-100)]/20",
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-[var(--teal-100)] text-xs text-[var(--teal-900)]">
            {getSenderInitials(email.from)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-1 text-left"
              >
                <span className="truncate font-medium">{sender}</span>
                {!expanded && (
                  <span className="min-w-0 truncate text-sm font-normal text-muted-foreground">
                    — {email.snippet || email.subject || "(no content)"}
                  </span>
                )}
              </button>

              {expanded && (
                <Popover>
                  <PopoverTrigger className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                    to {email.to ? getSenderDisplayName(email.to) : "me"}
                    <ChevronDown className="size-3" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 gap-3 p-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground">from:</p>
                        <p className="break-all">{formatSender(email.from)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">to:</p>
                        <p className="break-all">
                          {email.to ? formatSender(email.to) : "me"}
                        </p>
                      </div>
                      {email.date && (
                        <div>
                          <p className="font-medium text-muted-foreground">date:</p>
                          <p>{formatMessageDate(email.date)}</p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {email.date && (
                <time className="text-xs tabular-nums text-muted-foreground">
                  {formatMessageDate(email.date)}
                </time>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                aria-label={expanded ? "Collapse message" : "Expand message"}
              >
                {expanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
              <LinkifiedText
                text={email.body || email.snippet || "(empty message)"}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
