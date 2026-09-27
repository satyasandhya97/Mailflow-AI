import { GmailShellLayout } from "@/features/gmail/layouts/gmail-shell-layout";

export default function GmailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <GmailShellLayout>{children}</GmailShellLayout>;
}
