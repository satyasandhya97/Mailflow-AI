import type { ReactNode } from "react";

import { LinkifiedText } from "@/lib/linkified-text";

export function parseEmailAddress(raw: string) {
  const trimmed = raw.trim();
  const match = /^(.+?)\s*<([^>]+)>$/.exec(trimmed);
  if (match) {
    return {
      name: match[1]!.replace(/^"|"$/g, "").trim(),
      email: match[2]!.trim(),
    };
  }
  if (trimmed.includes("@")) {
    return { name: "", email: trimmed };
  }
  return { name: trimmed, email: "" };
}

export function formatSender(raw: string): ReactNode {
  if (!raw) return "unknown";

  const parts = raw.split(",").map((part) => parseEmailAddress(part));
  return parts.map((part, i) => (
    <span key={`${part.email}-${i}`}>
      {i > 0 && ", "}
      {part.name && part.email ? (
        <>
          {part.name} (
          <a href={`mailto:${part.email}`}>{part.email}</a>)
        </>
      ) : part.email ? (
        <a href={`mailto:${part.email}`}>{part.email}</a>
      ) : (
        part.name
      )}
    </span>
  ));
}

function parseDate(value: string | null | Date) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date(value);
}

export function formatMessageDate(value: string | null | Date) {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${time}`;
  }

  return `${date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}, ${time}`;
}

export { LinkifiedText };
