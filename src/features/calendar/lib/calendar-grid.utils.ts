import type { CalendarEvent } from "@/features/calendar/types";
import type { CalendarPaletteEntry } from "@/features/calendar/lib/calendar-theme";

/** Full-day week grid (midnight–midnight), like Google Calendar. */
export const GRID_START_HOUR = 0;
export const GRID_END_HOUR = 24;
export const GRID_TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
/** Comfortable hour row height — scrollable 24h grid (~1,152px total). */
export const MIN_HOUR_ROW_PX = 48;
export const GRID_COLS = "grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]";

/** Default scroll anchor when the current-time line is off-screen (8:00 AM). */
export const GRID_DEFAULT_SCROLL_HOUR = 8;

export const HOUR_LABELS: string[] = (() => {
  const labels: string[] = [];
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    labels.push(`${hour12} ${period}`);
  }
  return labels;
})();

export type PositionedEvent = {
  event: CalendarEvent;
  topPct: number;
  heightPct: number;
  column: number;
  columnCount: number;
  color: string;
  tint: string;
};

export type WeekLayout = {
  timedByDay: PositionedEvent[][];
  allDay: CalendarEvent[];
};

export function isAllDayEvent(event: CalendarEvent): boolean {
  if (!event.start) return false;
  return event.start.length === 10 || !event.start.includes("T");
}

export function getEventTimeRange(event: CalendarEvent) {
  const start = new Date(event.start);
  let end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  if (Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  return { start, end };
}

export function formatCompactTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? "p" : "a";
  const hour12 = h % 12 || 12;
  if (m === 0) return `${hour12}${period}`;
  return `${hour12}:${String(m).padStart(2, "0")}${period}`;
}

export function formatEventTimeRange(start: Date, end: Date): string {
  return `${formatCompactTime(start)} – ${formatCompactTime(end)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toGridMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

const GRID_START_MINUTES = GRID_START_HOUR * 60;
const GRID_END_MINUTES = GRID_END_HOUR * 60;
const GRID_TOTAL_MINUTES = GRID_END_MINUTES - GRID_START_MINUTES;

function minutesToOffsetPercent(minutes: number): number {
  const clamped = clamp(minutes, GRID_START_MINUTES, GRID_END_MINUTES);
  return ((clamped - GRID_START_MINUTES) / GRID_TOTAL_MINUTES) * 100;
}

export function getDefaultScrollTopPercent(): number {
  return (
    ((GRID_DEFAULT_SCROLL_HOUR * 60 - GRID_START_MINUTES) / GRID_TOTAL_MINUTES) *
    100
  );
}

export function getCurrentTimeTopPercent(now = new Date()): number | null {
  const minutes = toGridMinutes(now);
  if (minutes < GRID_START_MINUTES || minutes > GRID_END_MINUTES) {
    return null;
  }
  return minutesToOffsetPercent(minutes);
}

export function layoutWeekEvents(
  events: CalendarEvent[],
  weekStart: Date,
  palette: CalendarPaletteEntry,
): WeekLayout {
  const allDay: CalendarEvent[] = [];
  const byDay = new Map<number, CalendarEvent[]>();
  const timedByDay: PositionedEvent[][] = Array.from({ length: 7 }, () => []);

  for (const event of events) {
    if (isAllDayEvent(event)) {
      allDay.push(event);
      continue;
    }

    const range = getEventTimeRange(event);
    if (!range) continue;

    const dayIndex = Math.floor(
      (range.start.getTime() - weekStart.getTime()) / 86_400_000,
    );

    if (dayIndex < 0 || dayIndex > 6) continue;

    const list = byDay.get(dayIndex) ?? [];
    list.push(event);
    byDay.set(dayIndex, list);
  }

  for (const [dayIndex, dayEvents] of byDay.entries()) {
    const sorted = [...dayEvents].sort((a, b) => a.timestamp - b.timestamp);
    const columns: { end: number }[] = [];
    const dayPositioned: PositionedEvent[] = [];

    for (const event of sorted) {
      const range = getEventTimeRange(event);
      if (!range) continue;

      const startMin = toGridMinutes(range.start);
      const endMin = toGridMinutes(range.end);
      const topPct = minutesToOffsetPercent(startMin);
      const bottomPct = minutesToOffsetPercent(endMin);
      const heightPct = Math.max(bottomPct - topPct, 100 / GRID_TOTAL_HOURS / 2);

      let column = 0;
      while (column < columns.length && columns[column]!.end > startMin) {
        column++;
      }

      if (column === columns.length) {
        columns.push({ end: endMin });
      } else {
        columns[column] = { end: endMin };
      }

      dayPositioned.push({
        event,
        topPct,
        heightPct,
        column,
        columnCount: 1,
        color: palette.color,
        tint: palette.tint,
      });
    }

    const maxColumns = columns.length || 1;
    for (const item of dayPositioned) {
      item.columnCount = maxColumns;
      timedByDay[dayIndex]!.push(item);
    }
  }

  return { timedByDay, allDay };
}
