"use client";

import { Forward, Reply } from "lucide-react";

import { Button } from "@/components/ui/button";

type GmailMessageReplyBarProps = {
  onReply: () => void;
  onForward: () => void;
};

export function GmailMessageReplyBar({
  onReply,
  onForward,
}: GmailMessageReplyBarProps) {
  return (
    <div className="flex shrink-0 gap-3 border-t border-border/60 bg-[var(--cream-lifted)] px-6 py-4">
      <Button
        variant="outline"
        className="rounded-full px-5"
        onClick={onReply}
      >
        <Reply className="size-4" />
        Reply
      </Button>
      <Button
        variant="outline"
        className="rounded-full px-5"
        onClick={onForward}
      >
        <Forward className="size-4" />
        Forward
      </Button>
    </div>
  );
}
