/** Corsair brand + category palette — always prefer CSS vars over hardcoded hex. */
export const CALENDAR_BRAND = {
  primary: "var(--brand)",
  primaryHover: "var(--brand-hover)",
  primaryPress: "var(--brand-press)",
  foreground: "var(--brand-fg)",
  tint: "var(--brand-tint)",
  subtle: "var(--teal-50)",
} as const;

export const CALENDAR_PALETTE = [
  { color: "var(--brand)", tint: "var(--brand-tint)" },
  { color: "var(--cat-marine)", tint: "var(--cat-marine-tint)" },
  { color: "var(--cat-sage)", tint: "var(--cat-sage-tint)" },
  { color: "var(--cat-gold)", tint: "var(--cat-gold-tint)" },
  { color: "var(--cat-clay)", tint: "var(--cat-clay-tint)" },
  { color: "var(--cat-plum)", tint: "var(--cat-plum-tint)" },
  { color: "var(--cat-slate)", tint: "var(--cat-slate-tint)" },
] as const;

export type CalendarPaletteEntry = (typeof CALENDAR_PALETTE)[number];

export function resolveCalendarPalette(index = 0): CalendarPaletteEntry {
  return CALENDAR_PALETTE[index % CALENDAR_PALETTE.length]!;
}

export function resolveCalendarPaletteById(
  calendarId: string,
  calendarIds: string[],
): CalendarPaletteEntry {
  const idx = calendarIds.indexOf(calendarId);
  return resolveCalendarPalette(idx >= 0 ? idx : 0);
}

/** Shared class bundles for calendar UI surfaces. */
export const calendarUi = {
  todayBadge:
    "bg-[var(--brand)] font-semibold text-[var(--brand-fg)] shadow-sm",
  activeNav: "bg-[var(--brand-tint)] font-semibold text-[var(--teal-900)]",
  primaryButton:
    "rounded-full bg-[var(--brand)] text-[var(--brand-fg)] shadow-sm hover:bg-[var(--brand-hover)] active:bg-[var(--brand-press)]",
  link: "text-[var(--brand)] hover:text-[var(--brand-hover)]",
} as const;

/** Overrides DialogContent default sm:max-w-sm (384px). */
export const eventDialogContentClass =
  "flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-3xl lg:max-w-4xl flex-col gap-0 overflow-hidden p-0";
