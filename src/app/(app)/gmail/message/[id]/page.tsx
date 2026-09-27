import { GmailMessagePage } from "@/features/gmail/components/gmail-message-page";

type GmailMessageRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function GmailMessageRoutePage({
  params,
}: GmailMessageRouteProps) {
  const { id } = await params;

  return <GmailMessagePage messageId={id} />;
}
