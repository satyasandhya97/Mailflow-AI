"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MARKETING_APP_NAME,
  MARKETING_ROUTES,
} from "@/features/marketing/constants/marketing-routes";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Integrations", href: "/#integrations" },
] as const;

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <MarketingContainer size="xl">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href={MARKETING_ROUTES.home}
            className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              {MARKETING_APP_NAME}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href={MARKETING_ROUTES.login} />}
            >
              Log in
            </Button>
            <Button
              nativeButton={false}
              size="sm"
              className="rounded-full px-4"
              render={<Link href={MARKETING_ROUTES.signup} />}
            >
              Get started
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200 md:hidden",
            mobileOpen ? "max-h-80 pb-4" : "max-h-0",
          )}
        >
          <nav className="flex flex-col gap-1 border-t border-border pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-1">
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href={MARKETING_ROUTES.login} />}
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Button>
              <Button
                nativeButton={false}
                render={<Link href={MARKETING_ROUTES.signup} />}
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </Button>
            </div>
          </nav>
        </div>
      </MarketingContainer>
    </header>
  );
}
