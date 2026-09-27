"use client";

import Link from "next/link";
import {
  Clock,
  FileText,
  Inbox,
  Send,
  SquarePen,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { GmailLabelsSidebar } from "@/features/gmail/components/gmail-labels-sidebar";
import { useGmail } from "@/features/gmail/context/gmail-provider";
import {
  GMAIL_FOLDERS,
  type GmailFolderId,
} from "@/features/gmail/lib/gmail-ui.constants";
import {
  gmailFolderHref,
  type GmailPathState,
} from "@/features/gmail/lib/gmail-routes";

const FOLDER_ICONS = {
  inbox: Inbox,
  star: Star,
  clock: Clock,
  send: Send,
  file: FileText,
} as const;

type GmailShellSidebarProps = {
  route: GmailPathState;
  folderCounts: Partial<Record<GmailFolderId, number>>;
};

function sidebarTabValue(route: GmailPathState): GmailFolderId | "label" {
  if (route.folder === "message" || route.folder === "inbox") {
    return "inbox";
  }
  if (route.folder === "label") {
    return "label";
  }
  return route.folder;
}

export function GmailShellSidebar({ route, folderCounts }: GmailShellSidebarProps) {
  const { openCompose } = useGmail();
  const activeFolderTab =
    route.folder === "message" || route.folder === "label"
      ? route.folder === "label"
        ? "label"
        : "inbox"
      : route.folder;

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-4 pr-2">
      <Button
        size="lg"
        className="h-10 gap-4 rounded-full"
        onClick={openCompose}
      >
        <SquarePen className="size-5" />
        Compose
      </Button>

      <Tabs
        value={sidebarTabValue(route)}
        orientation="vertical"
        className="min-h-0 flex-1 gap-4"
      >
        <TabsList
          variant="line"
          className="h-auto w-full flex-col items-stretch gap-0.5 rounded-none bg-transparent p-0"
        >
          {GMAIL_FOLDERS.map((folder) => {
            const Icon = FOLDER_ICONS[folder.icon];
            const active = activeFolderTab === folder.id;
            const count = folderCounts[folder.id];

            return (
              <TabsTrigger
                key={folder.id}
                value={folder.id}
                nativeButton={false}
                render={<Link href={gmailFolderHref(folder.id)} />}
                className={cn(
                  "w-full justify-start gap-3 rounded-full px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--teal-100)] font-semibold text-[var(--teal-900)]"
                    : "text-foreground/80 hover:bg-muted/60",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1 text-left">{folder.label}</span>
                {count != null && count > 0 && (
                  <span className="text-xs font-semibold tabular-nums">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <GmailLabelsSidebar activeLabelId={route.labelId} />
    </aside>
  );
}
