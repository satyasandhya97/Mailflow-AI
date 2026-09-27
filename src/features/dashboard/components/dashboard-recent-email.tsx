"use client";

import Link from "next/link";
import { Inbox, Mail } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardRecentEmailSkeleton } from "@/features/dashboard/components/skeletons";
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";
import { gmailMessageHref } from "@/features/gmail/lib/gmail-routes";
import {
  formatInboxListDate,
  getSenderDisplayName,
  getSenderInitials,
} from "@/features/gmail/lib/gmail-ui.utils";

export function DashboardRecentEmail() {
  const { recentEmail, gmailConnected } = useDashboardData();
  const emails = recentEmail.data ?? [];

  const emptyTitle = gmailConnected ? "Inbox zero" : "Gmail not connected";
  const emptyMessage = gmailConnected
    ? "You're all caught up — nothing new to read."
    : "Connect Gmail to see your recent messages here.";

  return (
    <DashboardSection
      title="Recent email"
      icon={Mail}
      action={{ label: "Open inbox", href: "/gmail/inbox" }}
      isLoading={gmailConnected && recentEmail.isLoading}
      skeleton={<DashboardRecentEmailSkeleton />}
      isEmpty={emails.length === 0}
      emptyIcon={Inbox}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
    >
      <ul className="-mx-2">
        {emails.map((email) => (
          <li key={email.id}>
            <Link
              href={gmailMessageHref(email.id)}
              className="flex items-start gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
            >
              <Avatar className="mt-0.5">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {getSenderInitials(email.from)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {getSenderDisplayName(email.from)}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatInboxListDate(email.date)}
                  </span>
                </div>
                <p className="truncate text-sm">
                  {email.subject || "(no subject)"}
                </p>
                {email.snippet ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {email.snippet}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
