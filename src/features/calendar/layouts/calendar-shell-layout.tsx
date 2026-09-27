"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { CalendarNotConnected } from "@/features/calendar/components/calendar-not-connected";
import { CalendarShellSidebar } from "@/features/calendar/components/calendar-shell-sidebar";
import { InviteModal } from "@/features/calendar/components/invite-modal";
import {
  CalendarShellConnectionSkeleton,
  CalendarShellFallback,
} from "@/features/calendar/components/skeletons";
import {
  CalendarProvider,
  useCalendar,
} from "@/features/calendar/context/calendar-provider";
import { parseCalendarPathname } from "@/features/calendar/lib/calendar-routes";
import { api } from "@/trpc/react";

function CalendarShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = parseCalendarPathname(pathname);
  const {
    inviteOpen,
    closeInvite,
    createDraft,
    sendInvite,
    calendarId,
  } = useCalendar();

  const connection = api.integrations.getPluginStatus.useQuery({
    pluginId: "googlecalendar",
  });

  const isConnected = connection.data === "connected";
  const isCheckingConnection =
    connection.isLoading || connection.data === undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--cream-canvas)]">
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        {isConnected && <CalendarShellSidebar route={route} />}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isCheckingConnection && <CalendarShellConnectionSkeleton />}

          {!isCheckingConnection && !isConnected && <CalendarNotConnected />}

          {isConnected && children}
        </main>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={closeInvite}
        calendarId={calendarId}
        createDraft={createDraft}
        sendInvite={sendInvite}
      />
    </div>
  );
}

export function CalendarShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<CalendarShellFallback />}>
      <CalendarProvider>
        <CalendarShellInner>{children}</CalendarShellInner>
      </CalendarProvider>
    </Suspense>
  );
}
