import {
  encodeRawEmail,
  extractBodyFromPayload,
  getHeader,
} from "@/lib/email-encoding";
import { getTenantForUser } from "@/server/integrations/tenant";
import {
  getDraftCountFromApi,
  getDraftFromApi,
  listDraftsFromApi,
  syncDraftsCache,
} from "@/server/services/gmail-drafts.utils";
import { dedupeByEntityId } from "@/server/services/utils";

const METADATA_HEADERS = ["From", "To", "Subject", "Date"] as const;
const DB_SCAN_LIMIT = 250;

export type GmailListItem = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  timestamp: number;
  isStarred: boolean;
};

export type GmailMessageDetail = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  snippet: string;
  date: string | null;
  timestamp: number;
  isStarred: boolean;
  isUnread: boolean;
};

export type GmailThread = {
  id: string;
  subject: string;
  messages: GmailMessageDetail[];
};

export type GmailMessageWithThread = {
  message: GmailMessageDetail;
  thread: GmailThread;
};

export type GmailDraftItem = {
  id: string;
  messageId: string;
  subject: string;
  to: string;
  snippet: string;
  createdAt: string | null;
};

export type GmailLabelItem = {
  id: string;
  name: string;
  messagesUnread: number;
  messagesTotal: number;
};

type DbMessageRow = {
  entity_id: string;
  data: {
    threadId?: string;
    snippet?: string;
    subject?: string;
    from?: string;
    to?: string;
    body?: string;
    internalDate?: string;
    createdAt?: Date | null;
    labelIds?: string[];
  };
};

function messageTimestamp(
  internalDate?: string | number | Date | null,
  createdAt?: Date | null,
): number {
  if (internalDate != null) return Number(internalDate);
  if (createdAt) return createdAt.getTime();
  return 0;
}

function mapDbMessage(message: DbMessageRow): GmailListItem {
  return {
    id: message.entity_id,
    threadId: message.data.threadId ?? "",
    snippet: message.data.snippet ?? "",
    subject: message.data.subject ?? "",
    from: message.data.from ?? "",
    to: message.data.to ?? "",
    date: message.data.internalDate ?? null,
    timestamp: messageTimestamp(
      message.data.internalDate,
      message.data.createdAt,
    ),
    isStarred: message.data.labelIds?.includes("STARRED") ?? false,
  };
}

function mapDbMessageToDetail(message: DbMessageRow): GmailMessageDetail {
  const labelIds = message.data.labelIds ?? [];
  return {
    id: message.entity_id,
    threadId: message.data.threadId ?? "",
    subject: message.data.subject ?? "",
    from: message.data.from ?? "",
    to: message.data.to ?? "",
    body: message.data.body ?? message.data.snippet ?? "",
    snippet: message.data.snippet ?? "",
    date: message.data.internalDate ?? null,
    timestamp: messageTimestamp(
      message.data.internalDate,
      message.data.createdAt,
    ),
    isStarred: labelIds.includes("STARRED"),
    isUnread: labelIds.includes("UNREAD"),
  };
}

function mapApiListMessage(message: {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string | number | Date | null;
  labelIds?: string[];
  payload?: { headers?: { name?: string; value?: string }[] };
}): GmailListItem {
  const headers = message.payload?.headers;

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
    snippet: message.snippet ?? "",
    subject: getHeader(headers, "Subject"),
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    date: message.internalDate != null ? String(message.internalDate) : null,
    timestamp: messageTimestamp(message.internalDate),
    isStarred: message.labelIds?.includes("STARRED") ?? false,
  };
}

function mapApiFullMessage(message: {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string | number | Date | null;
  labelIds?: string[];
  payload?: Parameters<typeof extractBodyFromPayload>[0] & {
    headers?: { name?: string; value?: string }[];
  };
}): GmailMessageDetail {
  const headers = message.payload?.headers;
  const extracted = extractBodyFromPayload(message.payload);
  const labelIds = message.labelIds ?? [];

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
    subject: getHeader(headers, "Subject"),
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    body: extracted || (message.snippet ?? ""),
    snippet: message.snippet ?? "",
    date: message.internalDate != null ? String(message.internalDate) : null,
    timestamp: messageTimestamp(message.internalDate),
    isStarred: labelIds.includes("STARRED"),
    isUnread: labelIds.includes("UNREAD"),
  };
}

function sortMessagesNewestFirst(messages: GmailListItem[]): GmailListItem[] {
  return [...messages].sort((a, b) => b.timestamp - a.timestamp);
}

function sortMessagesOldestFirst(
  messages: GmailMessageDetail[],
): GmailMessageDetail[] {
  return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}

async function listDbMessages(userId: string): Promise<DbMessageRow[]> {
  const tenant = getTenantForUser(userId);
  const messages = await tenant.gmail.db.messages.list({
    limit: DB_SCAN_LIMIT,
    offset: 0,
  });
  return dedupeByEntityId(messages);
}

async function listMessagesFromDbByLabel(
  userId: string,
  labelId: string,
  limit: number,
  offset: number,
): Promise<GmailListItem[]> {
  const messages = await listDbMessages(userId);
  return sortMessagesNewestFirst(
    messages
      .filter((message) => message.data.labelIds?.includes(labelId))
      .map(mapDbMessage),
  ).slice(offset, offset + limit);
}

async function searchMessagesFromDb(
  userId: string,
  query: string,
  limit: number,
): Promise<GmailListItem[]> {
  const tenant = getTenantForUser(userId);
  const q = query.trim().toLowerCase();

  try {
    const [bySnippet, bySubject, byFrom] = await Promise.all([
      tenant.gmail.db.messages.search({
        data: { snippet: { contains: q } },
        limit,
      }),
      tenant.gmail.db.messages.search({
        data: { subject: { contains: q } },
        limit,
      }),
      tenant.gmail.db.messages.search({
        data: { from: { contains: q } },
        limit,
      }),
    ]);

    const merged = dedupeByEntityId([...bySnippet, ...bySubject, ...byFrom]);
    if (merged.length > 0) {
      return sortMessagesNewestFirst(merged.map(mapDbMessage));
    }
  } catch {
    // Fall through to in-memory scan.
  }

  const messages = await listDbMessages(userId);
  return sortMessagesNewestFirst(
    messages
      .filter((message) => {
        const haystack = [
          message.data.subject,
          message.data.snippet,
          message.data.from,
          message.data.to,
          message.data.body,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .map(mapDbMessage),
  ).slice(0, limit);
}

async function listMessagesFromApi(
  userId: string,
  input: {
    labelIds?: string[];
    q?: string;
    limit: number;
  },
): Promise<GmailListItem[]> {
  const tenant = getTenantForUser(userId);

  const result = await tenant.gmail.api.messages.list({
    labelIds: input.labelIds,
    q: input.q,
    maxResults: input.limit,
  });

  const ids = (result.messages ?? [])
    .map((message) => message.id)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    return [];
  }

  const messages = await Promise.all(
    ids.map((id) =>
      tenant.gmail.api.messages.get({
        id,
        format: "metadata",
        metadataHeaders: [...METADATA_HEADERS],
      }),
    ),
  );

  return sortMessagesNewestFirst(messages.map(mapApiListMessage));
}

async function listMessagesDbFirst(
  userId: string,
  input: {
    labelId?: string;
    q?: string;
    limit: number;
    offset: number;
  },
): Promise<GmailListItem[]> {
  const fromDb = input.q
    ? await searchMessagesFromDb(userId, input.q, input.limit)
    : input.labelId
      ? await listMessagesFromDbByLabel(
          userId,
          input.labelId,
          input.limit,
          input.offset,
        )
      : [];

  if (fromDb.length > 0) {
    return fromDb;
  }

  return listMessagesFromApi(userId, {
    labelIds: input.labelId ? [input.labelId] : undefined,
    q: input.q,
    limit: input.limit,
  });
}

async function getThreadFromDb(
  userId: string,
  threadId: string,
): Promise<GmailThread | null> {
  const messages = await listDbMessages(userId);
  const threadMessages = messages.filter(
    (message) => message.data.threadId === threadId,
  );

  if (threadMessages.length === 0) {
    return null;
  }

  const mapped = sortMessagesOldestFirst(
    threadMessages.map(mapDbMessageToDetail),
  );

  return {
    id: threadId,
    subject: mapped[0]?.subject ?? "",
    messages: mapped,
  };
}

async function getThreadFromApi(
  userId: string,
  threadId: string,
): Promise<GmailThread> {
  const tenant = getTenantForUser(userId);
  const thread = await tenant.gmail.api.threads.get({
    id: threadId,
    format: "full",
  });

  const messages = sortMessagesOldestFirst(
    (thread.messages ?? []).map(mapApiFullMessage),
  );

  return {
    id: thread.id ?? threadId,
    subject: messages[0]?.subject ?? "",
    messages,
  };
}

export async function searchEmails(
  userId: string,
  input: {
    query: string;
    limit: number;
    offset: number;
  },
) {
  if (input.query.trim()) {
    return listMessagesDbFirst(userId, {
      q: input.query.trim(),
      limit: input.limit,
      offset: input.offset,
    });
  }

  const tenant = getTenantForUser(userId);
  const messages = await tenant.gmail.db.messages.list({
    limit: input.limit,
    offset: input.offset,
  });

  const fromDb = sortMessagesNewestFirst(
    dedupeByEntityId(messages).map(mapDbMessage),
  );

  if (fromDb.length > 0) {
    return fromDb;
  }

  return listMessagesFromApi(userId, { limit: input.limit });
}

export async function listSentEmails(
  userId: string,
  input: { limit: number; offset: number },
) {
  return listMessagesDbFirst(userId, {
    labelId: "SENT",
    limit: input.limit,
    offset: input.offset,
  });
}

export async function listGmailMessagesForAgent(
  userId: string,
  input: {
    label?: "INBOX" | "SENT" | "STARRED" | "DRAFT";
    query?: string;
    todayOnly?: boolean;
    limit?: number;
  },
) {
  const limit = input.limit ?? 25;
  const parts = [input.query?.trim(), input.todayOnly ? gmailTodayQuery() : ""]
    .filter(Boolean)
    .join(" ");
  const q = parts.length > 0 ? parts : undefined;

  if (input.label || q) {
    const fromApi = await listMessagesFromApi(userId, {
      labelIds: input.label ? [input.label] : undefined,
      q,
      limit,
    });

    if (fromApi.length > 0) {
      return fromApi;
    }
  }

  const fromDb = await listMessagesDbFirst(userId, {
    labelId: input.label,
    q,
    limit,
    offset: 0,
  });

  if (!input.todayOnly) {
    return fromDb;
  }

  const start = startOfLocalDayMs(new Date());
  const end = endOfLocalDayMs(new Date());

  return fromDb.filter(
    (message) => message.timestamp >= start && message.timestamp <= end,
  );
}

function startOfLocalDayMs(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function endOfLocalDayMs(date: Date): number {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
}

function gmailTodayQuery(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ty = tomorrow.getFullYear();
  const tm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const td = String(tomorrow.getDate()).padStart(2, "0");

  return `after:${y}/${m}/${d} before:${ty}/${tm}/${td}`;
}

export async function listStarredEmails(
  userId: string,
  input: { limit: number; offset: number },
) {
  return listMessagesDbFirst(userId, {
    labelId: "STARRED",
    limit: input.limit,
    offset: input.offset,
  });
}

export async function listEmailsByLabel(
  userId: string,
  input: { labelId: string; limit: number; offset: number },
) {
  return listMessagesDbFirst(userId, {
    labelId: input.labelId,
    limit: input.limit,
    offset: input.offset,
  });
}

export async function getMessage(userId: string, id: string) {
  const tenant = getTenantForUser(userId);
  const cached = await tenant.gmail.db.messages.findByEntityId(id);

  if (cached?.data.body || cached?.data.subject) {
    return mapDbMessageToDetail(cached);
  }

  const message = await tenant.gmail.api.messages.get({
    id,
    format: "full",
  });

  return mapApiFullMessage(message);
}

export async function getThread(userId: string, threadId: string) {
  const fromDb = await getThreadFromDb(userId, threadId);
  if (fromDb) {
    return fromDb;
  }
  return getThreadFromApi(userId, threadId);
}

export async function getMessageWithThread(userId: string, messageId: string) {
  const message = await getMessage(userId, messageId);

  if (!message.threadId) {
    return {
      message,
      thread: {
        id: "",
        subject: message.subject,
        messages: [message],
      },
    };
  }

  const fromDb = await getThreadFromDb(userId, message.threadId);
  const thread = fromDb ?? (await getThreadFromApi(userId, message.threadId));

  return { message, thread };
}

export async function modifyMessages(
  userId: string,
  input: {
    ids: string[];
    addLabelIds?: string[];
    removeLabelIds?: string[];
  },
) {
  if (input.ids.length === 0) {
    return { updated: 0 };
  }

  const tenant = getTenantForUser(userId);

  if (input.ids.length === 1) {
    await tenant.gmail.api.messages.modify({
      id: input.ids[0]!,
      addLabelIds: input.addLabelIds,
      removeLabelIds: input.removeLabelIds,
    });
  } else {
    await tenant.gmail.api.messages.batchModify({
      ids: input.ids,
      addLabelIds: input.addLabelIds,
      removeLabelIds: input.removeLabelIds,
    });
  }

  return { updated: input.ids.length };
}

export async function archiveMessages(userId: string, ids: string[]) {
  return modifyMessages(userId, {
    ids,
    removeLabelIds: ["INBOX"],
  });
}

export async function trashMessages(userId: string, ids: string[]) {
  const tenant = getTenantForUser(userId);
  await Promise.all(
    ids.map((id) => tenant.gmail.api.messages.trash({ id })),
  );
  return { trashed: ids.length };
}

export async function listDrafts(
  userId: string,
  input: { limit: number; offset: number },
) {
  const tenant = getTenantForUser(userId);

  try {
    return await listDraftsFromApi(tenant, input);
  } catch {
    const cached = await tenant.gmail.db.drafts.list({
      limit: input.limit,
      offset: input.offset,
    });

    if (cached.length === 0) {
      return [];
    }

    return Promise.all(
      dedupeByEntityId(cached).map(async (draft): Promise<GmailDraftItem> => {
        const messageId = draft.data.messageId ?? "";
        const message = messageId
          ? await tenant.gmail.db.messages.findByEntityId(messageId)
          : null;

        return {
          id: draft.entity_id,
          messageId,
          subject: message?.data.subject ?? "(no subject)",
          to: message?.data.to ?? "",
          snippet: message?.data.snippet ?? "",
          createdAt:
            draft.data.createdAt?.toISOString() ??
            message?.data.internalDate ??
            null,
        };
      }),
    );
  }
}

export async function getDraftCount(userId: string) {
  const tenant = getTenantForUser(userId);

  try {
    return await getDraftCountFromApi(tenant);
  } catch {
    const cached = await tenant.gmail.db.drafts.list({
      limit: 100,
      offset: 0,
    });
    return cached.length;
  }
}

export async function refreshDrafts(userId: string) {
  const tenant = getTenantForUser(userId);
  const synced = await syncDraftsCache(tenant, 100);
  return { synced };
}

export async function getDraft(userId: string, id: string) {
  const tenant = getTenantForUser(userId);

  try {
    return await getDraftFromApi(tenant, id);
  } catch {
    const cached = await tenant.gmail.db.drafts.findByEntityId(id);

    if (cached?.data.messageId) {
      const message = await tenant.gmail.db.messages.findByEntityId(
        cached.data.messageId,
      );
      if (message?.data.subject || message?.data.body) {
        return {
          id: cached.entity_id,
          messageId: cached.data.messageId,
          to: message.data.to ?? "",
          subject: message.data.subject ?? "",
          body: message.data.body ?? message.data.snippet ?? "",
        };
      }
    }

    throw new Error("Draft not found.");
  }
}

export async function updateDraft(
  userId: string,
  input: {
    id: string;
    to: string;
    subject: string;
    body: string;
  },
) {
  const tenant = getTenantForUser(userId);
  const raw = encodeRawEmail(input);
  const draft = await tenant.gmail.api.drafts.update({
    id: input.id,
    draft: { message: { raw } },
  });
  return {
    id: draft.id ?? input.id,
    messageId: draft.message?.id ?? "",
  };
}

export async function deleteDraft(userId: string, id: string) {
  const tenant = getTenantForUser(userId);
  await tenant.gmail.api.drafts.delete({ id });
  await syncDraftsCache(tenant, 100);
  return { deleted: true };
}

export async function listLabels(userId: string) {
  const tenant = getTenantForUser(userId);

  try {
    const cached = await tenant.gmail.db.labels.list({ limit: 100, offset: 0 });
    const userLabels = dedupeByEntityId(cached)
      .filter((label) => label.data.type === "user")
      .map(
        (label): GmailLabelItem => ({
          id: label.entity_id,
          name: label.data.name ?? label.entity_id,
          messagesUnread: label.data.messagesUnread ?? 0,
          messagesTotal: label.data.messagesTotal ?? 0,
        }),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    if (userLabels.length > 0) {
      return userLabels;
    }
  } catch {
    // Fall through to live API.
  }

  const result = await tenant.gmail.api.labels.list({});

  return (result.labels ?? [])
    .filter((label) => label.type === "user")
    .map(
      (label): GmailLabelItem => ({
        id: label.id ?? "",
        name: label.name ?? "",
        messagesUnread: label.messagesUnread ?? 0,
        messagesTotal: label.messagesTotal ?? 0,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function refreshInbox(userId: string) {
  const tenant = getTenantForUser(userId);
  const result = await tenant.gmail.api.threads.list({ maxResults: 100 });
  return {
    synced: result.threads?.length ?? 0,
  };
}

export async function createDraft(
  userId: string,
  input: {
    to: string;
    subject: string;
    body: string;
  },
) {
  const tenant = getTenantForUser(userId);
  const raw = encodeRawEmail(input);
  const draft = await tenant.gmail.api.drafts.create({
    draft: { message: { raw } },
  });
  return {
    id: draft.id ?? "",
    messageId: draft.message?.id ?? "",
  };
}

export async function sendDraft(userId: string, draftId: string) {
  const tenant = getTenantForUser(userId);
  const message = await tenant.gmail.api.drafts.send({ id: draftId });
  await syncDraftsCache(tenant, 100);
  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
  };
}

export async function sendEmail(
  userId: string,
  input: {
    to: string;
    subject: string;
    body: string;
  },
) {
  const tenant = getTenantForUser(userId);
  const raw = encodeRawEmail(input);
  const message = await tenant.gmail.api.messages.send({ raw });
  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
  };
}
