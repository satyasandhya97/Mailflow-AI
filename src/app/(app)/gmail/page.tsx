import { redirect } from "next/navigation";

import { GMAIL_INBOX_DEFAULT } from "@/features/gmail/lib/gmail-routes";

export default function GmailIndexPage() {
  redirect(GMAIL_INBOX_DEFAULT);
}
