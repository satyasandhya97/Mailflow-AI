"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  GmailShellConnectionSkeleton,
  GmailShellFallback,
} from "@/features/gmail/components/skeletons";
import { GmailProvider, useGmail } from "@/features/gmail/context/gmail-provider";
import { GmailHeader } from "@/features/gmail/components/gmail-header";
import { GmailShellSidebar } from "@/features/gmail/components/gmail-shell-sidebar";
import { GmailNotConnected } from "@/features/gmail/components/gmail-thread-view";
import { parseGmailPathname } from "@/features/gmail/lib/gmail-routes";
import { GMAIL_LIST_STALE_MS } from "@/features/gmail/lib/gmail-query-options";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { api } from "@/trpc/react";

function GmailShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = parseGmailPathname(pathname);
  const {
    unreadCount,
    searchInput,
    setSearchInput,
    submitSearch,
    searchInputRef,
    closeCompose,
  } = useGmail();

  const connection = api.integrations.getPluginStatus.useQuery({
    pluginId: "gmail",
  });

  const draftCount = api.gmail.getDraftCount.useQuery(undefined, {
    enabled: connection.data === "connected",
    staleTime: GMAIL_LIST_STALE_MS,
  });

  useKeyboardShortcuts({
    onEscape: () => closeCompose(),
  });

  useEffect(() => {
    function handleMetaK(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleMetaK);
    return () => window.removeEventListener("keydown", handleMetaK);
  }, [searchInputRef]);

  const isConnected = connection.data === "connected";
  const isCheckingConnection =
    connection.isLoading || connection.data === undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col ">
      <GmailHeader
        ref={searchInputRef}
        unreadCount={unreadCount}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={submitSearch}
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden pb-4 px-4">
        <GmailShellSidebar
          route={route}
          folderCounts={{
            inbox: unreadCount,
            drafts: draftCount.data,
          }}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isCheckingConnection && <GmailShellConnectionSkeleton />}

          {!isCheckingConnection && !isConnected && <GmailNotConnected />}

          {isConnected && children}
        </main>
      </div>
    </div>
  );
}

export function GmailShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<GmailShellFallback />}>
      <GmailProvider>
        <GmailShellInner>{children}</GmailShellInner>
      </GmailProvider>
    </Suspense>
  );
}
