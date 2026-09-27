import {
  extractBodyFromPayload,
  getHeader,
} from "@/lib/email-encoding";
import type { getTenantForUser } from "@/server/integrations/tenant";
import type { GmailDraftItem } from "@/server/services/gmail.service";

type GmailTenant = ReturnType<typeof getTenantForUser>;

type ApiDraftMessage = {
  id?: string;
  snippet?: string;
  internalDate?: string | number | Date | null;
  payload?: Parameters<typeof extractBodyFromPayload>[0] & {
    headers?: { name?: string; value?: string }[];
  };
};

type ApiDraft = {
  id?: string;
  message?: ApiDraftMessage;
};

export function mapApiDraftToItem(
  draft: ApiDraft,
  headers?: { name?: string; value?: string }[],
): GmailDraftItem {
  const message = draft.message;
  const subject =
    getHeader(headers ?? message?.payload?.headers, "Subject") ??
    message?.snippet?.slice(0, 60) ??
    "(no subject)";

  return {
    id: draft.id ?? "",
    messageId: message?.id ?? "",
    subject,
    to: getHeader(headers ?? message?.payload?.headers, "To"),
    snippet: message?.snippet ?? "",
    createdAt:
      message?.internalDate != null ? String(message.internalDate) : null,
  };
}

export async function fetchDraftItemFromApi(
  tenant: GmailTenant,
  draftId: string,
): Promise<GmailDraftItem | null> {
  if (!draftId) return null;

  try {
    const draft = await tenant.gmail.api.drafts.get({
      id: draftId,
      format: "metadata",
    });

    const headers = draft.message?.payload?.headers;
    return mapApiDraftToItem(draft, headers);
  } catch {
    return null;
  }
}

export async function syncDraftsCache(
  tenant: GmailTenant,
  maxResults = 100,
): Promise<number> {
  const result = await tenant.gmail.api.drafts.list({ maxResults });
  return result.drafts?.length ?? 0;
}

export async function listDraftsFromApi(
  tenant: GmailTenant,
  input: { limit: number; offset: number },
): Promise<GmailDraftItem[]> {
  const result = await tenant.gmail.api.drafts.list({
    maxResults: Math.min(input.limit + input.offset, 100),
  });

  const drafts = (result.drafts ?? []).slice(
    input.offset,
    input.offset + input.limit,
  );

  const items = await Promise.all(
    drafts.map(async (draft) => {
      if (!draft.id) return null;

      if (draft.message?.snippet) {
        return mapApiDraftToItem(draft);
      }

      return fetchDraftItemFromApi(tenant, draft.id);
    }),
  );

  return items.filter((item): item is GmailDraftItem => item !== null);
}

export async function getDraftCountFromApi(
  tenant: GmailTenant,
): Promise<number> {
  const result = await tenant.gmail.api.drafts.list({ maxResults: 100 });
  return result.drafts?.length ?? 0;
}

export async function getDraftFromApi(tenant: GmailTenant, id: string) {
  const draft = await tenant.gmail.api.drafts.get({
    id,
    format: "full",
  });

  const headers = draft.message?.payload?.headers;
  const body =
    extractBodyFromPayload(draft.message?.payload) ??
    draft.message?.snippet ??
    "";

  return {
    id: draft.id ?? id,
    messageId: draft.message?.id ?? "",
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject") ?? "(no subject)",
    body,
  };
}
