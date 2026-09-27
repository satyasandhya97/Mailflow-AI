"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { useInbox } from "@/features/gmail/hooks/use-inbox";

type GmailInboxDataContextValue = ReturnType<typeof useInbox>;

const GmailInboxDataContext = createContext<GmailInboxDataContextValue | null>(
  null,
);

export function useGmailInboxData() {
  const context = useContext(GmailInboxDataContext);
  if (!context) {
    throw new Error(
      "useGmailInboxData must be used within GmailInboxDataProvider.",
    );
  }
  return context;
}

export function GmailInboxDataProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const inbox = useInbox({
    activeSearch: searchQuery,
    view: "inbox",
    selectedId: null,
  });

  useEffect(() => {
    if (
      !inbox.emails.isLoading &&
      inbox.emails.data?.length === 0 &&
      !searchQuery
    ) {
      inbox.refreshInbox.mutate();
    }
    // Only auto-sync once on mount when empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GmailInboxDataContext.Provider value={inbox}>
      {children}
    </GmailInboxDataContext.Provider>
  );
}
