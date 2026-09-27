import { GOOGLE_OAUTH_SCOPES } from "@/features/marketing/constants/google-oauth-scopes";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingEyebrow } from "@/features/marketing/components/marketing-eyebrow";
import { MarketingSection } from "@/features/marketing/components/marketing-section";

export function GoogleDataAccessSection() {
  return (
    <MarketingSection id="google-data-access">
      <MarketingContainer size="lg">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <MarketingEyebrow className="mb-3">Google data access</MarketingEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What we access and why
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Mailflow AI only accesses Google data after you connect Gmail or
            Google Calendar on the Plugins page. Each permission is used solely to
            provide the features shown during OAuth consent.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium text-foreground">Scope</th>
                  <th className="px-4 py-3 font-medium text-foreground">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {GOOGLE_OAUTH_SCOPES.map((item) => (
                  <tr key={item.scope} className="align-top">
                    <td className="px-4 py-3 text-foreground">
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.scope}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-muted-foreground">
          We do not sell Google user data, use it for advertising, or allow humans
          to read your email or calendar content except when you request support,
          for security, or to comply with law. You can disconnect plugins or revoke
          access from your Google Account at any time.
        </p>
      </MarketingContainer>
    </MarketingSection>
  );
}
