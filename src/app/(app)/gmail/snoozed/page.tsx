import { GmailFolderPlaceholder } from "@/features/gmail/components/gmail-folder-placeholder";

export default function GmailSnoozedRoutePage() {
  return (
    <GmailFolderPlaceholder
      title="Snoozed mail"
      description="This folder is not synced yet. Use Inbox to browse synced messages."
    />
  );
}
