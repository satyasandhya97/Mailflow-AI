"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GmailComposeSkeleton } from "@/features/gmail/components/skeletons";
import { cn } from "@/lib/utils";
import {
  useCompose,
  type ComposeMode,
  type ComposeSaveStatus,
} from "@/features/gmail/hooks/use-compose";

function composeTitle(mode: ComposeMode, isEditing: boolean) {
  if (isEditing) return "Draft";
  if (mode === "reply") return "Reply";
  if (mode === "forward") return "Forward";
  return "New Message";
}

function saveStatusLabel(status: ComposeSaveStatus) {
  if (status === "saving") return "Saving…";
  if (status === "saved") return "Draft saved";
  if (status === "error") return "Could not save draft";
  return null;
}

type ComposeFieldRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
};

function ComposeFieldRow({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: ComposeFieldRowProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
      <span className="w-14 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

export function GmailComposePanel({
  open,
  draftId,
  mode,
  messageId,
  onClose,
}: {
  open: boolean;
  draftId: string | null;
  mode: ComposeMode;
  messageId: string | null;
  onClose: () => void;
}) {
  const compose = useCompose({
    open,
    draftId,
    mode,
    messageId,
  });
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const title = composeTitle(mode, compose.isEditing);
  const statusLabel = saveStatusLabel(compose.saveStatus);
  const isSendBusy = compose.isSending || compose.isSaving;
  const sendButtonLabel = compose.isSending
    ? "Sending…"
    : compose.isSaving
      ? "Saving…"
      : "Send";

  useEffect(() => {
    if (open && !minimized && !compose.isLoadingDraft) {
      bodyRef.current?.focus();
    }
  }, [open, minimized, compose.isLoadingDraft]);

  useEffect(() => {
    if (!open) {
      setMinimized(false);
      setShowCc(false);
      setShowBcc(false);
      setCc("");
      setBcc("");
      setIsClosing(false);
    }
  }, [open]);

  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      if (compose.hasContent) {
        await compose.saveDraft();
        compose.flushListDraftsInvalidate();
      }
    } finally {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!compose.canSend || isSendBusy) return;
    await compose.sendMessage();
    onClose();
  };

  const handleDiscard = async () => {
    const draftToDelete = compose.activeDraftId;
    if (draftToDelete) {
      await compose.deleteDraft.mutateAsync({ id: draftToDelete });
    }
    onClose();
  };

  if (!open) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-4 z-50 flex w-[min(280px,calc(100vw-2rem))] items-center justify-between rounded-t-lg border border-border/60 bg-[var(--cream-lifted)] px-4 py-2.5 shadow-xl">
        <button
          type="button"
          className="truncate text-sm font-medium"
          onClick={() => setMinimized(false)}
        >
          {title}
        </button>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expand"
            onClick={() => setMinimized(false)}
          >
            <Minus className="size-4 rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            disabled={isClosing}
            onClick={() => void handleClose()}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-4 z-50 flex w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-t-xl border border-border/60 bg-[var(--cream-lifted)] shadow-2xl",
        "max-h-[min(560px,85vh)]",
      )}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          void handleSend();
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {statusLabel && (
            <span
              className={cn(
                "truncate text-xs text-muted-foreground",
                compose.saveStatus === "error" && "text-destructive",
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Minimize"
            onClick={() => setMinimized(true)}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            disabled={isClosing}
            onClick={() => void handleClose()}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {compose.isLoadingDraft ? (
        <GmailComposeSkeleton />
      ) : (
        <>
          <div className="shrink-0">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
              <span className="w-14 shrink-0 text-sm text-muted-foreground">
                To
              </span>
              <input
                type="email"
                value={compose.to}
                onChange={(e) => compose.setTo(e.target.value)}
                placeholder="Recipients"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {!showCc && (
                <button
                  type="button"
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCc(true)}
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowBcc(true)}
                >
                  Bcc
                </button>
              )}
            </div>

            {showCc && (
              <ComposeFieldRow
                label="Cc"
                value={cc}
                onChange={setCc}
                placeholder="Cc recipients"
              />
            )}
            {showBcc && (
              <ComposeFieldRow
                label="Bcc"
                value={bcc}
                onChange={setBcc}
                placeholder="Bcc recipients"
              />
            )}

            <ComposeFieldRow
              label="Subject"
              value={compose.subject}
              onChange={compose.setSubject}
              placeholder="Subject"
            />
          </div>

          <textarea
            ref={bodyRef}
            value={compose.body}
            onChange={(e) => compose.setBody(e.target.value)}
            placeholder=""
            className="min-h-[220px] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed outline-none"
          />

          <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-3 py-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-[var(--teal-900)] px-6 hover:bg-[var(--teal-700)]"
              onClick={() => void handleSend()}
              disabled={isSendBusy || !compose.canSend}
            >
              {sendButtonLabel}
            </Button>

            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Discard draft"
                onClick={() => void handleDiscard()}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {(compose.createDraft.error ??
            compose.updateDraft.error ??
            compose.sendEmail.error ??
            compose.sendDraft.error) && (
            <p className="shrink-0 px-4 pb-2 text-xs text-destructive">
              {(
                compose.createDraft.error ??
                compose.updateDraft.error ??
                compose.sendEmail.error ??
                compose.sendDraft.error
              )?.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** @deprecated Use GmailComposePanel */
export const ComposeModal = GmailComposePanel;
