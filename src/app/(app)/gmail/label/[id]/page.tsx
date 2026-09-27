import { GmailLabelView } from "@/features/gmail/components/gmail-label-view";

type GmailLabelRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GmailLabelRoutePage({
  params,
}: GmailLabelRoutePageProps) {
  const { id } = await params;
  return <GmailLabelView labelId={id} />;
}
