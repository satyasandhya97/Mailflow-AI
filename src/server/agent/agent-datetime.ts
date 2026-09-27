export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export type CalendarListPeriod = "today" | "week" | "month" | "upcoming";

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function normalizeRfc3339(
  value: string,
  boundary: "start" | "end",
): string {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return boundary === "end"
      ? `${trimmed}T23:59:59.999Z`
      : `${trimmed}T00:00:00.000Z`;
  }

  if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes("T")) {
    return `${trimmed.replace(/\.\d+$/, "")}Z`;
  }

  return `${trimmed}T00:00:00.000Z`;
}

export function resolveCalendarWindow(input: {
  period?: CalendarListPeriod;
  timeMin?: string;
  timeMax?: string;
}): { timeMin: string; timeMax: string } {
  if (!input.period && !input.timeMin && !input.timeMax) {
    return resolveCalendarWindow({ period: "upcoming" });
  }

  if (input.period) {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (input.period) {
      case "today":
        start = startOfLocalDay(now);
        end = endOfLocalDay(now);
        break;
      case "week":
        start = startOfLocalDay(now);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start = startOfLocalDay(now);
        end = new Date(start);
        end.setDate(end.getDate() + 30);
        end.setHours(23, 59, 59, 999);
        break;
      case "upcoming":
        start = startOfLocalDay(now);
        start.setDate(start.getDate() - 7);
        end = new Date(start);
        end.setDate(end.getDate() + 56);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }

  if (!input.timeMin || !input.timeMax) {
    throw new Error(
      "Use period (today|week|month|upcoming) or provide both timeMin and timeMax as ISO datetimes with timezone.",
    );
  }

  const timeMin = normalizeRfc3339(input.timeMin, "start");
  const timeMax = normalizeRfc3339(input.timeMax, "end");

  if (new Date(timeMin).getTime() >= new Date(timeMax).getTime()) {
    throw new Error(
      "timeMin must be before timeMax. Include timezone (Z or offset) in datetimes.",
    );
  }

  return { timeMin, timeMax };
}
