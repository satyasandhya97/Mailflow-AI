"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, SquarePen } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatTodayLabel,
  getFirstName,
  getGreeting,
} from "@/features/dashboard/lib/dashboard-greeting";
import { gmailComposeHref } from "@/features/gmail/lib/gmail-routes";
import { getSenderInitials } from "@/features/gmail/lib/gmail-ui.utils";
import { api } from "@/trpc/react";

export function DashboardHeader() {
  const me = api.auth.me.useQuery();
  // Greeting and date are derived from the local clock/locale, which differ
  // between server and client — render them only after mount to avoid a
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const showGreeting = mounted && !me.isLoading;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {!mounted || me.isLoading ? (
          <Skeleton className="size-10 rounded-full" />
        ) : (
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/10 font-medium text-primary">
              {getSenderInitials(me.data?.fullName ?? "")}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="space-y-1">
          {showGreeting ? (
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {getGreeting()}, {getFirstName(me.data?.fullName)}
            </h1>
          ) : (
            <Skeleton className="h-8 w-56" />
          )}
          {mounted ? (
            <p className="text-sm text-muted-foreground">{formatTodayLabel()}</p>
          ) : (
            <Skeleton className="h-4 w-40" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href={gmailComposeHref("/gmail/inbox")} />}
        >
          <SquarePen className="size-4" />
          Compose
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/tasks" />}
        >
          <Plus className="size-4" />
          New task
        </Button>
      </div>
    </header>
  );
}
