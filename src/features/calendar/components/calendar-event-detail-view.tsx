"use client";

import { Calendar, Clock, MapPin, Users } from "lucide-react";

import {
  formatAttendees,
  formatEventWhen,
  LinkifiedText,
} from "@/features/calendar/lib/display";
import type { CalendarEventDetail } from "@/features/calendar/types";
import { cn } from "@/lib/utils";

type CalendarEventDetailViewProps = {
  event: CalendarEventDetail;
  accentColor?: string;
  className?: string;
};

export function CalendarEventDetailView({
  event,
  accentColor = "var(--brand)",
  className,
}: CalendarEventDetailViewProps) {
  return (
    <article className={cn("px-6 py-6", className)}>
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-background"
          style={{ backgroundColor: accentColor }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {event.summary || "Untitled event"}
          </h1>
          {event.status && event.status !== "confirmed" && (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {event.status}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-8 space-y-5">
        <DetailRow icon={Clock} label="When">
          {formatEventWhen(event.start, event.end) || "—"}
        </DetailRow>

        {event.location && (
          <DetailRow icon={MapPin} label="Location">
            {event.location}
          </DetailRow>
        )}

        {event.attendees.length > 0 && (
          <DetailRow icon={Users} label="Guests">
            {formatAttendees(event.attendees)}
          </DetailRow>
        )}

        {event.description && (
          <DetailRow icon={Calendar} label="Description">
            <div className="prose prose-sm max-w-none text-foreground">
              <LinkifiedText text={event.description} />
            </div>
          </DetailRow>
        )}
      </dl>
    </article>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <dt className="flex w-28 shrink-0 items-start gap-2 text-sm text-muted-foreground">
        <Icon className="mt-0.5 size-4 shrink-0" />
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm leading-relaxed">{children}</dd>
    </div>
  );
}
