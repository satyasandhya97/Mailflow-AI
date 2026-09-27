import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { MARKETING_APP_NAME } from "@/features/marketing/constants/marketing-routes";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MarketingShell>{children}</MarketingShell>;
}

export const metadata = {
  title: {
    default: MARKETING_APP_NAME,
    template: `%s · ${MARKETING_APP_NAME}`,
  },
  description:
    "Email, calendar, plugins, and AI agents in one focused workspace powered by Mailflow AI.",
};
