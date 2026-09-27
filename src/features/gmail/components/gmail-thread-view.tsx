"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { GmailThreadContentSkeleton } from "@/features/gmail/components/skeletons";
import { GmailMessageDetailToolbar } from "@/features/gmail/components/gmail-message-detail-toolbar";
import { GmailMessageReplyBar } from "@/features/gmail/components/gmail-message-reply-bar";
import { GmailThreadMessageCard } from "@/features/gmail/components/gmail-thread-message-card";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import { gmailMessageHref } from "@/features/gmail/lib/gmail-routes";
import type { EmailMessage } from "@/features/gmail/types";

type GmailThreadViewProps = {
  subject: string;
  messages: EmailMessage[];
  highlightMessageId: string | null;
  isLoading: boolean;
  error: { message: string } | null;
  onBack: () => void;
  onReply: (messageId: string) => void;
  onForward: (messageId: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  actionsPending?: boolean;
};

export function GmailThreadView({
  subject,
  messages,
  highlightMessageId,
  isLoading,
  error,
  onBack,
  onReply,
  onForward,
  onArchive,
  onDelete,
  actionsPending = false,
}: GmailThreadViewProps) {
  const router = useRouter();
  const { starredIds, toggleStar } = useGmail();

  const highlightIndex = useMemo(() => {
    if (!highlightMessageId) return Math.max(0, messages.length - 1);
    const index = messages.findIndex((m) => m.id === highlightMessageId);
    return index >= 0 ? index : Math.max(0, messages.length - 1);
  }, [messages, highlightMessageId]);

  const activeMessage = messages[highlightIndex];
  const isStarred =
    activeMessage &&
    (starredIds.has(activeMessage.id) || activeMessage.isStarred === true);

  const [olderExpanded, setOlderExpanded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (messages.length === 0) return;
    setExpandedIds(() => {
      const next = new Set<string>();
      for (const message of messages.slice(highlightIndex)) {
        next.add(message.id);
      }
      if (highlightMessageId) next.add(highlightMessageId);
      return next;
    });
    setOlderExpanded(false);
  }, [messages, highlightIndex, highlightMessageId]);

  const olderMessages = messages.slice(0, highlightIndex);
  const currentAndNewer = messages.slice(highlightIndex);
  const olderCount = olderMessages.length;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToMessage = (index: number) => {
    const target = messages[index];
    if (target) router.push(gmailMessageHref(target.id));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)]">
      <GmailMessageDetailToolbar
        onBack={onBack}
        onArchive={onArchive}
        onDelete={onDelete}
        onToggleStar={() => {
          if (activeMessage) {
            toggleStar(activeMessage.id, isStarred === true);
          }
        }}
        isStarred={isStarred === true}
        threadIndex={highlightIndex + 1}
        threadTotal={messages.length || 1}
        onPrev={
          highlightIndex > 0 ? () => goToMessage(highlightIndex - 1) : undefined
        }
        onNext={
          highlightIndex < messages.length - 1
            ? () => goToMessage(highlightIndex + 1)
            : undefined
        }
        actionsPending={actionsPending}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading && <GmailThreadContentSkeleton />}

        {error && (
          <p className="px-6 py-5 text-sm text-destructive">{error.message}</p>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <>
            <div className="border-b border-border/60 px-6 py-4">
              <h1 className="text-[1.375rem] font-normal leading-snug tracking-tight">
                {subject ?? messages[0]?.subject ?? "(no subject)"}
              </h1>
            </div>

            {olderCount > 0 && !olderExpanded && (
              <div className="border-b border-border/50 px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setOlderExpanded(true)}
                >
                  {olderCount} older message{olderCount === 1 ? "" : "s"}
                </Button>
              </div>
            )}

            {olderExpanded &&
              olderMessages.map((email) => (
                <GmailThreadMessageCard
                  key={email.id}
                  email={email}
                  expanded={expandedIds.has(email.id)}
                  onToggle={() => toggleExpanded(email.id)}
                />
              ))}

            {currentAndNewer.map((email) => (
              <GmailThreadMessageCard
                key={email.id}
                email={email}
                expanded={expandedIds.has(email.id)}
                onToggle={() => toggleExpanded(email.id)}
                isHighlighted={email.id === highlightMessageId}
              />
            ))}
          </>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <p className="px-6 py-5 text-sm text-muted-foreground">
            Message not found.{" "}
            <button type="button" className="underline" onClick={onBack}>
              Back to inbox
            </button>
          </p>
        )}
      </div>

      {!isLoading && !error && activeMessage && (
        <GmailMessageReplyBar
          onReply={() => onReply(activeMessage.id)}
          onForward={() => onForward(activeMessage.id)}
        />
      )}
    </div>
  );
}

export function GmailNotConnected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
      <p className="text-lg font-medium">Connect Gmail to view your inbox</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Go to Plugins and connect your Google account to sync emails through
        Corsair.
      </p>
      <a
        href="/plugins"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Open Plugins
      </a>
    </div>
  );
}
