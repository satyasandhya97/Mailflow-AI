export type GmailFolderId =
  | "inbox"
  | "starred"
  | "snoozed"
  | "sent"
  | "drafts";

export const GMAIL_FOLDERS: {
  id: GmailFolderId;
  label: string;
  icon: "inbox" | "star" | "clock" | "send" | "file";
}[] = [
  { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "starred", label: "Starred", icon: "star" },
  { id: "snoozed", label: "Snoozed", icon: "clock" },
  { id: "sent", label: "Sent", icon: "send" },
  { id: "drafts", label: "Drafts", icon: "file" },
];
