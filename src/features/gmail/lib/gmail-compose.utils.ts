import {
  formatMessageDate,
  parseEmailAddress,
} from "@/features/gmail/lib/display";

export function extractReplyTo(from: string): string {
  const first = from.split(",")[0]?.trim() ?? from;
  return parseEmailAddress(first).email;
}

export function buildReplySubject(subject: string): string {
  const trimmed = subject.trim();
  if (/^re:/i.test(trimmed)) return trimmed;
  return `Re: ${trimmed || "(no subject)"}`;
}

export function buildForwardSubject(subject: string): string {
  const trimmed = subject.trim();
  if (/^fwd:/i.test(trimmed)) return trimmed;
  return `Fwd: ${trimmed || "(no subject)"}`;
}

export function buildQuotedBody(
  body: string,
  from: string,
  date: string | null,
): string {
  const header = `On ${formatMessageDate(date) || "unknown date"}, ${from} wrote:`;
  const quoted = body
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `\n\n${header}\n${quoted}`;
}

export function buildForwardBody(
  body: string,
  from: string,
  to: string,
  subject: string,
  date: string | null,
): string {
  const header = [
    "",
    "---------- Forwarded message ---------",
    `From: ${from}`,
    `Date: ${formatMessageDate(date) || ""}`,
    `Subject: ${subject}`,
    `To: ${to}`,
    "",
  ].join("\n");
  return `${header}${body}`;
}

export function hasComposeContent(
  to: string,
  subject: string,
  body: string,
): boolean {
  return Boolean(to.trim() || subject.trim() || body.trim());
}

export function buildDraftPayload(
  to: string,
  subject: string,
  body: string,
) {
  return {
    to: to.trim(),
    subject: subject.trim() || "(no subject)",
    body: body.trim(),
  };
}

export function canSendEmail(to: string, body: string): boolean {
  const trimmedTo = to.trim();
  if (!trimmedTo || !body.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedTo);
}

export function composeSnapshotKey(
  to: string,
  subject: string,
  body: string,
): string {
  return `${to}\u0000${subject}\u0000${body}`;
}
