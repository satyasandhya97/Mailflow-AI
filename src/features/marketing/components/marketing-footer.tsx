import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import {
  MARKETING_APP_NAME,
  MARKETING_ROUTES,
  MARKETING_SUPPORT_EMAIL,
} from "@/features/marketing/constants/marketing-routes";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";

const footerLinks = [
  { label: "Privacy Policy", href: MARKETING_ROUTES.privacyPolicy },
  { label: "Terms & Conditions", href: MARKETING_ROUTES.termsAndConditions },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <MarketingContainer size="xl" className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Link
              href={MARKETING_ROUTES.home}
              className="inline-flex items-center gap-2.5 text-foreground"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <span className="text-sm font-semibold">{MARKETING_APP_NAME}</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Email, calendar, plugins, and AI agents in one focused workspace
              powered by Corsair.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`${MARKETING_ROUTES.home}#features`}
                  className="transition-colors hover:text-foreground"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href={`${MARKETING_ROUTES.home}#how-it-works`}
                  className="transition-colors hover:text-foreground"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href={`${MARKETING_ROUTES.home}#google-data-access`}
                  className="transition-colors hover:text-foreground"
                >
                  Google data access
                </Link>
              </li>
              <li>
                <Link
                  href={`${MARKETING_ROUTES.home}#integrations`}
                  className="transition-colors hover:text-foreground"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  href={MARKETING_ROUTES.signup}
                  className="transition-colors hover:text-foreground"
                >
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Legal</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
                  className="transition-colors hover:text-foreground"
                >
                  {MARKETING_SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {MARKETING_APP_NAME}. All rights reserved.</p>
          <p>Built for teams who live in email and calendar.</p>
        </div>
      </MarketingContainer>
    </footer>
  );
}
