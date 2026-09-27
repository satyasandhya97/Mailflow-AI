import { redirect } from "next/navigation";

import {
  GMAIL_INBOX_DEFAULT,
  gmailInboxHref,
} from "@/features/gmail/lib/gmail-routes";

type InboxRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InboxRedirectPage({
  searchParams,
}: InboxRedirectPageProps) {
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "inbox";
  const message =
    typeof params.message === "string" ? params.message : undefined;

  if (message) {
    redirect(`/gmail/message/${message}`);
  }

  if (tab === "inbox") {
    redirect(gmailInboxHref());
  }

  if (tab === "starred" || tab === "drafts" || tab === "sent" || tab === "snoozed") {
    redirect(`/gmail/${tab}`);
  }

  redirect(GMAIL_INBOX_DEFAULT);
}
