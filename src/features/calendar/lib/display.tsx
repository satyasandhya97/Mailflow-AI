import type { ReactNode } from "react";

import { LinkifiedText } from "@/lib/linkified-text";
import { parseEmailAddress } from "@/features/gmail/lib/display";

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventWhen(start: string, end: string) {
  if (!start) return "";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (Number.isNaN(startDate.getTime())) return start;

  const datePart = startDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return `${datePart}, ${formatTime(startDate)}`;
  }

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${datePart}, ${formatTime(startDate)} – ${formatTime(endDate)}`;
  }

  return `${startDate.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} – ${endDate.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function formatAttendees(attendees: string[]): ReactNode {
  if (attendees.length === 0) return null;
  return attendees.map((attendee, i) => {
    const { name, email } = parseEmailAddress(attendee);
    const label = email || name;
    return (
      <span key={`${label}-${i}`}>
        {i > 0 && ", "}
        {email ? <a href={`mailto:${email}`}>{name || email}</a> : name}
      </span>
    );
  });
}

export { LinkifiedText };
