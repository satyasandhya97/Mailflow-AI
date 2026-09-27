import { cn } from "@/lib/utils";

import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingEyebrow } from "@/features/marketing/components/marketing-eyebrow";

type LegalDocumentProps = {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalDocument({
  title,
  eyebrow,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <MarketingContainer size="md" className="py-16 sm:py-20">
      <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <header className="mb-10 border-b border-border pb-8">
          <MarketingEyebrow className="mb-3">{eyebrow}</MarketingEyebrow>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div
          className={cn(
            "space-y-8 text-sm leading-7 text-muted-foreground",
            "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
            "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
            "[&_p]:leading-7",
            "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
            "[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground",
            "[&_strong]:text-foreground",
          )}
        >
          {children}
        </div>
      </article>
    </MarketingContainer>
  );
}
