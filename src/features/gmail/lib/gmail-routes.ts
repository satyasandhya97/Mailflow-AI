import {
  GMAIL_FOLDERS,
  type GmailFolderId,
} from "@/features/gmail/lib/gmail-ui.constants";

export const GMAIL_PATH = "/gmail";
export const GMAIL_INBOX_DEFAULT = `${GMAIL_PATH}/inbox` as const;

const FOLDER_IDS = new Set<GmailFolderId>(GMAIL_FOLDERS.map((f) => f.id));

export type GmailPathState = {
  folder: GmailFolderId | "message" | "label";
  messageId: string | null;
  labelId: string | null;
};

export function parseGmailPathname(pathname: string): GmailPathState {
  const segments = pathname
    .replace(new RegExp(`^${GMAIL_PATH}/?`), "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      folder: "inbox",
      messageId: null,
      labelId: null,
    };
  }

  const [head, second] = segments;

  if (head === "inbox") {
    return {
      folder: "inbox",
      messageId: null,
      labelId: null,
    };
  }

  if (head === "message") {
    return {
      folder: "message",
      messageId: second ?? null,
      labelId: null,
    };
  }

  if (head === "label") {
    return {
      folder: "label",
      messageId: null,
      labelId: second ?? null,
    };
  }

  if (FOLDER_IDS.has(head as GmailFolderId)) {
    return {
      folder: head as GmailFolderId,
      messageId: null,
      labelId: null,
    };
  }

  return {
    folder: "inbox",
    messageId: null,
    labelId: null,
  };
}

export function gmailInboxHref(): string {
  return GMAIL_INBOX_DEFAULT;
}

export function gmailFolderHref(folder: GmailFolderId): string {
  if (folder === "inbox") return gmailInboxHref();
  return `${GMAIL_PATH}/${folder}`;
}

export function gmailMessageHref(messageId: string): string {
  return `${GMAIL_PATH}/message/${messageId}`;
}

export function gmailComposeHref(returnPath: string): string {
  const url = new URL(returnPath, "http://local");
  url.searchParams.delete("draftId");
  url.searchParams.delete("mode");
  url.searchParams.delete("messageId");
  url.searchParams.set("compose", "1");
  return `${url.pathname}${url.search}`;
}

export function gmailComposeDraftHref(path: string, draftId: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("compose", "1");
  url.searchParams.set("draftId", draftId);
  url.searchParams.delete("mode");
  url.searchParams.delete("messageId");
  return `${url.pathname}${url.search}`;
}

export function gmailComposeReplyHref(path: string, messageId: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("compose", "1");
  url.searchParams.set("mode", "reply");
  url.searchParams.set("messageId", messageId);
  return `${url.pathname}${url.search}`;
}

export function gmailComposeForwardHref(
  path: string,
  messageId: string,
): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("compose", "1");
  url.searchParams.set("mode", "forward");
  url.searchParams.set("messageId", messageId);
  return `${url.pathname}${url.search}`;
}

export function gmailLabelHref(labelId: string): string {
  return `${GMAIL_PATH}/label/${labelId}`;
}

export function withSearchQuery(path: string, query: string): string {
  if (!query.trim()) return path;
  const url = new URL(path, "http://local");
  url.searchParams.set("q", query.trim());
  return `${url.pathname}${url.search}`;
}

export function isLegacyInboxCategoryPath(pathname: string): boolean {
  return /^\/gmail\/inbox\/[^/]+/.test(pathname);
}

export function isLegacyLabelPath(pathname: string): boolean {
  return pathname === "/gmail/label" || pathname.startsWith("/gmail/label/");
}
