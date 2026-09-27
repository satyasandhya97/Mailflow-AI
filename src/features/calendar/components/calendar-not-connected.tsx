export function CalendarNotConnected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-[var(--brand)]/25 bg-gradient-to-b from-[var(--brand-tint)]/40 to-transparent p-12 text-center">
      <div className="rounded-full bg-[var(--brand-tint)] p-4">
        <svg
          className="size-8 text-[var(--brand)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold tracking-tight text-[var(--teal-900)]">
          Connect Google Calendar
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sync your schedule, create events, and find free time — all through
          Corsair.
        </p>
      </div>
      <a href="/plugins" className="inline-flex h-10 items-center justify-center px-6 text-sm font-medium rounded-full bg-[var(--brand)] text-[var(--brand-fg)] shadow-sm transition-colors hover:bg-[var(--brand-hover)]">
        Connect in Plugins
      </a>
    </div>
  );
}
