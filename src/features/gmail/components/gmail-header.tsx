"use client";

import { Search } from "lucide-react";
import { forwardRef } from "react";

import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type GmailHeaderProps = {
  unreadCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  className?: string;
};

export const GmailHeader = forwardRef<HTMLInputElement, GmailHeaderProps>(
  function GmailHeader(
    {
      unreadCount,
      searchValue,
      onSearchChange,
      onSearchSubmit,
      className,
    },
    ref,
  ) {
    return (
      <header
        className={cn(
          "flex shrink-0 items-center gap-3 px-8 py-2",
          className,
        )}
      >
        <SidebarTrigger className="md:hidden" />

        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="text-xl font-normal tracking-tight">Gmail</h1>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {unreadCount} unread
            </span>
          )}
        </div>

        <form
          className="relative mx-auto hidden w-full max-w-2xl sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={ref}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search mail"
            className="h-11 rounded-full border-border/60 bg-muted/30 pl-10 pr-16 shadow-none focus-visible:ring-[var(--teal-700)]/30"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </form>
      </header>
    );
  },
);
