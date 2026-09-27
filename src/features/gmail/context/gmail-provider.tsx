"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GmailComposePanel } from "@/features/gmail/components/compose-modal";
import { useGmailActions } from "@/features/gmail/hooks/use-gmail-actions";
import {
  gmailComposeDraftHref,
  gmailComposeForwardHref,
  gmailComposeHref,
  gmailComposeReplyHref,
  withSearchQuery,
} from "@/features/gmail/lib/gmail-routes";
import { GMAIL_LIST_STALE_MS } from "@/features/gmail/lib/gmail-query-options";
import { api } from "@/trpc/react";
import type { ComposeMode } from "@/features/gmail/hooks/use-compose";

type GmailContextValue = {
  starredIds: Set<string>;
  readIds: Set<string>;
  selectedIds: Set<string>;
  toggleStar: (id: string, currentlyStarred: boolean) => void;
  markRead: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelectedIds: (ids: Set<string>) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  submitSearch: () => void;
  searchQuery: string;
  unreadCount: number;
  openCompose: () => void;
  openComposeDraft: (draftId: string) => void;
  openComposeReply: (messageId: string) => void;
  openComposeForward: (messageId: string) => void;
  closeCompose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  archiveSelected: () => void;
  trashSelected: () => void;
  markSelectedUnread: () => void;
  actionsPending: boolean;
};

const GmailContext = createContext<GmailContextValue | null>(null);

export function useGmail() {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error("useGmail must be used within GmailProvider.");
  }
  return context;
}

function needsInboxCache(pathname: string) {
  return (
    pathname.startsWith("/gmail/inbox") ||
    pathname.startsWith("/gmail/message")
  );
}

export function GmailProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actions = useGmailActions();

  const searchQuery = searchParams.get("q") ?? "";
  const composeOpen = searchParams.get("compose") === "1";
  const draftIdParam = searchParams.get("draftId")?.trim();
  const draftId =
    draftIdParam && draftIdParam.length > 0 ? draftIdParam : null;
  const composeMode = (searchParams.get("mode") as ComposeMode) ?? null;
  const composeMessageIdParam = searchParams.get("messageId")?.trim();
  const composeMessageId =
    composeMessageIdParam && composeMessageIdParam.length > 0
      ? composeMessageIdParam
      : null;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const emails = api.gmail.searchEmails.useQuery(
    { query: "", limit: 50, offset: 0 },
    {
      enabled: needsInboxCache(pathname),
      staleTime: GMAIL_LIST_STALE_MS,
    },
  );

  const unreadCount = useMemo(
    () =>
      (emails.data ?? []).filter(
        (email) => !readIds.has(email.id) && email.id,
      ).length,
    [emails.data, readIds],
  );

  const toggleStar = useCallback(
    (id: string, currentlyStarred: boolean) => {
      const nextStarred = !currentlyStarred;
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (nextStarred) next.add(id);
        else next.delete(id);
        return next;
      });
      actions.toggleStar(id, nextStarred);
    },
    [actions],
  );

  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => new Set(prev).add(id));
      actions.markRead([id]);
    },
    [actions],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const archiveSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    actions.archiveMessages.mutate(
      { ids },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }, [actions.archiveMessages, selectedIds]);

  const trashSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    actions.trashMessages.mutate(
      { ids },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }, [actions.trashMessages, selectedIds]);

  const markSelectedUnread = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    actions.markUnread(ids);
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, [actions, selectedIds]);

  const submitSearch = useCallback(() => {
    const next = withSearchQuery(pathname, searchInput);
    router.push(next, { scroll: false });
  }, [pathname, router, searchInput]);

  const openCompose = useCallback(() => {
    router.push(
      gmailComposeHref(
        `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
      ),
      { scroll: false },
    );
  }, [pathname, router, searchParams]);

  const openComposeDraft = useCallback(
    (id: string) => {
      router.push(gmailComposeDraftHref(pathname, id), { scroll: false });
    },
    [pathname, router],
  );

  const openComposeReply = useCallback(
    (messageId: string) => {
      router.push(gmailComposeReplyHref(pathname, messageId), { scroll: false });
    },
    [pathname, router],
  );

  const openComposeForward = useCallback(
    (messageId: string) => {
      router.push(gmailComposeForwardHref(pathname, messageId), {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const closeCompose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("compose");
    params.delete("draftId");
    params.delete("mode");
    params.delete("messageId");
    const suffix = params.toString();
    router.push(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const value = useMemo(
    () => ({
      starredIds,
      readIds,
      selectedIds,
      toggleStar,
      markRead,
      toggleSelected,
      setSelectedIds,
      searchInput,
      setSearchInput,
      submitSearch,
      searchQuery,
      unreadCount,
      openCompose,
      openComposeDraft,
      openComposeReply,
      openComposeForward,
      closeCompose,
      searchInputRef,
      archiveSelected,
      trashSelected,
      markSelectedUnread,
      actionsPending: actions.isPending,
    }),
    [
      starredIds,
      readIds,
      selectedIds,
      toggleStar,
      markRead,
      toggleSelected,
      searchInput,
      submitSearch,
      searchQuery,
      unreadCount,
      openCompose,
      openComposeDraft,
      openComposeReply,
      openComposeForward,
      closeCompose,
      archiveSelected,
      trashSelected,
      markSelectedUnread,
      actions.isPending,
    ],
  );

  return (
    <GmailContext.Provider value={value}>
      {children}
      <GmailComposePanel
        open={composeOpen}
        draftId={composeOpen ? draftId : null}
        mode={
          composeOpen &&
          (composeMode === "reply" || composeMode === "forward")
            ? composeMode
            : null
        }
        messageId={composeOpen ? composeMessageId : null}
        onClose={closeCompose}
      />
    </GmailContext.Provider>
  );
}
