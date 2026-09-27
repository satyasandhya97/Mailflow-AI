import { parseEmailAddress } from "@/features/gmail/lib/display";

export function getSenderDisplayName(from: string): string {
  if (!from) return "Unknown";
  const first = from.split(",")[0]?.trim() ?? from;
  const parsed = parseEmailAddress(first);
  return parsed.name || parsed.email || first;
}

export function getSenderInitials(from: string): string {
  const name = getSenderDisplayName(from);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (name.slice(0, 2) || "?").toUpperCase();
}

export function formatInboxListDate(value: string | null): string {
  if (!value) return "";

  const ms = Number(value);
  const date = Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
