"use client";

import Link from "next/link";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
      <SidebarTrigger className="-ml-1 md:hidden" />

      <input
        aria-label="Search workspace"
        className="h-9 w-full max-w-md rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        placeholder="Search emails, events, plugins..."
        type="search"
      />

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/gmail/inbox?compose=1" />}
        >
          Compose
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/calendar" />}
        >
          New event
        </Button>
      </div>
    </header>
  );
}
