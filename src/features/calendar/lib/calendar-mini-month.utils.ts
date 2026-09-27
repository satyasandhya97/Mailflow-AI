import type { CalendarEvent } from "@/features/calendar/types";

export function getWeekOffsetForDate(target: Date): number {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() + mondayOffset);

  const targetDay = target.getDay();
  const targetMondayOffset = targetDay === 0 ? -6 : 1 - targetDay;
  const targetWeekStart = new Date(target);
  targetWeekStart.setHours(0, 0, 0, 0);
  targetWeekStart.setDate(targetWeekStart.getDate() + targetMondayOffset);

  const diffDays =
    (targetWeekStart.getTime() - currentWeekStart.getTime()) / 86_400_000;
  return Math.round(diffDays / 7);
}

export function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7;

  const days: (Date | null)[] = Array.from({ length: startPad }, () => null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export function eventCountsByDate(events: CalendarEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    const ts =
      event.timestamp > 0
        ? event.timestamp
        : event.start
          ? new Date(event.start).getTime()
          : 0;
    if (!ts) continue;
    const key = new Date(ts).toDateString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
