"use client";

import Link from "next/link";
import { Tag } from "lucide-react";

import { cn } from "@/lib/utils";
import { gmailLabelHref } from "@/features/gmail/lib/gmail-routes";
import { GMAIL_LABELS_STALE_MS } from "@/features/gmail/lib/gmail-query-options";
import { api } from "@/trpc/react";

type GmailLabelsSidebarProps = {
  activeLabelId: string | null;
};

export function GmailLabelsSidebar({ activeLabelId }: GmailLabelsSidebarProps) {
  const labels = api.gmail.listLabels.useQuery(undefined, {
    staleTime: GMAIL_LABELS_STALE_MS,
  });

  if (labels.isLoading || !labels.data?.length) {
    return null;
  }

  return (
    <div className="mt-2 border-t border-border/60 pt-4">
      <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Labels
      </p>
      <ul className="space-y-0.5">
        {labels.data.map((label) => {
          const active = activeLabelId === label.id;
          return (
            <li key={label.id}>
              <Link
                href={gmailLabelHref(label.id)}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--teal-100)] font-semibold text-[var(--teal-900)]"
                    : "text-foreground/80 hover:bg-muted/60",
                )}
              >
                <Tag className="size-[18px] shrink-0" />
                <span className="flex-1 truncate text-left">{label.name}</span>
                {label.messagesUnread > 0 && (
                  <span className="text-xs font-semibold tabular-nums">
                    {label.messagesUnread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
