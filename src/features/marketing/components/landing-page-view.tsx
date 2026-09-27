import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Mail,
  Plug,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleDataAccessSection } from "@/features/marketing/components/google-data-access-section";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingEyebrow } from "@/features/marketing/components/marketing-eyebrow";
import { MarketingSection } from "@/features/marketing/components/marketing-section";
import {
  MARKETING_ROUTES,
  MARKETING_SUPPORT_EMAIL,
} from "@/features/marketing/constants/marketing-routes";

const features = [
  {
    icon: Mail,
    title: "Gmail inbox",
    description:
      "Read, search, compose, and send email through a fast, focused interface synced with your Gmail account.",
  },
  {
    icon: CalendarDays,
    title: "Google Calendar",
    description:
      "View your week, inspect events, and manage invites without switching between tabs and tools.",
  },
  {
    icon: Plug,
    title: "Plugin connections",
    description:
      "Connect Gmail and Google Calendar securely with OAuth. Each user keeps their own tokens and data.",
  },
  {
    icon: Bot,
    title: "AI agent",
    description:
      "Ask an assistant to help with inbox triage, scheduling, and plugin workflows inside your workspace.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up with email verification and access your personal Mailflow AI.",
  },
  {
    step: "02",
    title: "Connect your plugins",
    description:
      "Authorize Gmail and Google Calendar so Mailflow AI can sync messages and events for your account.",
  },
  {
    step: "03",
    title: "Work from one place",
    description:
      "Manage email, calendar, and agent tasks from a single clean dashboard designed for speed.",
  },
] as const;

const integrations = [
  "Gmail read, compose, and send",
  "Gmail labels and mailbox organization",
  "Google Calendar events and availability",
  "Secure OAuth 2.0 with offline refresh tokens",
  "Webhook-driven sync for live updates",
] as const;

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "OAuth-only access",
    description:
      "We connect through Google OAuth. You control which Google account is linked and can disconnect anytime.",
  },
  {
    icon: ShieldCheck,
    title: "Per-user isolation",
    description:
      "Each workspace user has separate integration credentials and cached data scoped to their account.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent policies",
    description:
      "Our privacy policy and terms explain what data we access, why we need it, and how you can contact us.",
  },
] as const;

export function LandingHeroSection() {
  return (
    <MarketingSection size="lg" className="overflow-hidden">
      <MarketingContainer size="xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="space-y-8">
            <MarketingEyebrow>Mailflow AI</MarketingEyebrow>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.05]">
                Your email, calendar, and agents in one clean workspace.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Connect Gmail and Google Calendar, then manage your work through
                a focused interface powered by seamless integrations and our proprietary AI.
              </p>
              <p className="text-sm text-muted-foreground">
                <Link
                  href={`${MARKETING_ROUTES.home}#google-data-access`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  See what Google data we access
                </Link>
                {" · "}
                <Link
                  href={MARKETING_ROUTES.privacyPolicy}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </Link>
                {" · "}
                <a
                  href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Contact
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                nativeButton={false}
                size="lg"
                className="h-10 rounded-full px-5"
                render={<Link href={MARKETING_ROUTES.signup} />}
              >
                Get started free
                <ArrowRight />
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                size="lg"
                className="h-10 rounded-full px-5"
                render={<Link href={MARKETING_ROUTES.login} />}
              >
                Log in
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Today</p>
                  <p className="text-xs text-muted-foreground">
                    12 emails · 3 meetings
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Synced
                </span>
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 size-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Inbox triage with AI
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Summarize threads and draft replies faster.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 size-2 rounded-full bg-[var(--cat-gold)]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Calendar at a glance
                    </p>
                    <p className="text-xs text-muted-foreground">
                      See your week and send invites without context switching.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 size-2 rounded-full bg-[var(--cat-sage)]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Plugin connections
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gmail and Google Calendar connected per user via OAuth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

export function LandingFeaturesSection() {
  return (
    <MarketingSection id="features" variant="muted">
      <MarketingContainer size="xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <MarketingEyebrow className="mb-3">Features</MarketingEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to stay on top of work
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Mailflow AI brings your most important communication tools into
            one consistent, fast experience.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full bg-background/80">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

export function LandingHowItWorksSection() {
  return (
    <MarketingSection id="how-it-works">
      <MarketingContainer size="lg">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <MarketingEyebrow className="mb-3">How it works</MarketingEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From signup to synced workspace in minutes
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((item) => (
            <Card key={item.step} className="h-full bg-background/80">
              <CardContent className="space-y-4 pt-6">
                <p className="text-xs font-semibold tracking-[0.2em] text-primary">
                  STEP {item.step}
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

export function LandingIntegrationsSection() {
  return (
    <MarketingSection id="integrations" variant="brand">
      <MarketingContainer size="lg">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <MarketingEyebrow className="mb-3">Integrations</MarketingEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built on Google OAuth with clear permissions
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Mailflow AI connects to Gmail and Google Calendar using standard Google
              OAuth scopes. Users explicitly approve access during plugin
              connection.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <ul className="space-y-3">
              {integrations.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

export function LandingTrustSection() {
  return (
    <MarketingSection variant="muted">
      <MarketingContainer size="lg">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <MarketingEyebrow className="mb-3">Trust & security</MarketingEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Designed for clarity and user control
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {trustPoints.map((point) => (
            <Card key={point.title} className="bg-background/80">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <point.icon className="size-5" />
                </div>
                <CardTitle>{point.title}</CardTitle>
                <CardDescription>{point.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

export function LandingCtaSection() {
  return (
    <MarketingSection size="sm">
      <MarketingContainer size="md" asCard>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ready to open your workspace?
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Create an account, connect your plugins, and start managing email
              and calendar from one place.
            </p>
          </div>
          <Button
            nativeButton={false}
            size="lg"
            className="h-10 rounded-full px-5"
            render={<Link href={MARKETING_ROUTES.signup} />}
          >
            Start for free
            <ArrowRight />
          </Button>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

export function LandingPageView() {
  return (
    <>
      <LandingHeroSection />
      <LandingFeaturesSection />
      <LandingHowItWorksSection />
      <LandingIntegrationsSection />
      <GoogleDataAccessSection />
      <LandingTrustSection />
      <LandingCtaSection />
    </>
  );
}
