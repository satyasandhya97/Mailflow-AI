import { addMinutes, format, setHours, setMinutes, setSeconds } from "date-fns";

export const TIME_SLOT_MINUTES = 15;

export type TimeSlot = {
  value: string;
  label: string;
};

export function buildTimeSlots(intervalMinutes = TIME_SLOT_MINUTES): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += intervalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const labelDate = setMinutes(setHours(new Date(2000, 0, 1), hours), minutes);
    slots.push({ value, label: format(labelDate, "h:mm a") });
  }

  return slots;
}

export const TIME_SLOTS = buildTimeSlots();

export function roundToTimeSlot(date: Date, intervalMinutes = TIME_SLOT_MINUTES): Date {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const rounded =
    Math.round(minutes / intervalMinutes) * intervalMinutes;
  const clamped = Math.min(rounded, 24 * 60 - intervalMinutes);
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return setSeconds(setMinutes(setHours(date, hours), mins), 0);
}

export function getDefaultEventTimes(): { start: Date; end: Date } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return { start, end };
}

export function dateToTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function applyTimeValue(date: Date, timeValue: string): Date {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return setSeconds(setMinutes(setHours(date, hours ?? 0), minutes ?? 0), 0);
}

export function applyDatePart(date: Date, nextDate: Date): Date {
  const merged = new Date(date);
  merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
  return merged;
}

export function formatEventDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatEventDateLong(date: Date): string {
  return format(date, "EEE, MMM d, yyyy");
}

export function formatEventTime(date: Date): string {
  return format(date, "h:mm a");
}

export function isEndBeforeOrEqualStart(start: Date, end: Date): boolean {
  return end.getTime() <= start.getTime();
}

export function ensureEndAfterStart(start: Date, end: Date, fallbackMinutes = 60): Date {
  if (!isEndBeforeOrEqualStart(start, end)) return end;
  return addMinutes(start, fallbackMinutes);
}

export const DURATION_PRESETS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "1.5 hr", minutes: 90 },
  { label: "2 hr", minutes: 120 },
] as const;
