import type { RouterOutputs } from "@/trpc/react";

export type EmailListItem = RouterOutputs["gmail"]["searchEmails"][number];
export type EmailMessage = RouterOutputs["gmail"]["getMessage"];
export type GmailThread = RouterOutputs["gmail"]["getThread"];
export type GmailMessageWithThread = RouterOutputs["gmail"]["getMessageWithThread"];
export type DraftItem = RouterOutputs["gmail"]["listDrafts"][number];
export type LabelItem = RouterOutputs["gmail"]["listLabels"][number];
