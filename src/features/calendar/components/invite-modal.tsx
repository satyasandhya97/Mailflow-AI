"use client";

import { Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventDateTimeRange } from "@/features/calendar/components/event-datetime-range";
import { EventLocationField } from "@/features/calendar/components/event-location-field";
import {
  getDefaultEventTimes,
  isEndBeforeOrEqualStart,
} from "@/features/calendar/lib/calendar-datetime.utils";
import { calendarUi, eventDialogContentClass } from "@/features/calendar/lib/calendar-theme";
import type { useCalendar } from "@/features/calendar/hooks/use-calendar";
import { cn } from "@/lib/utils";

type CalendarMutations = Pick<
  ReturnType<typeof useCalendar>,
  "createDraft" | "sendInvite"
>;

function FormSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 space-y-3", className)}>
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      {children}
    </section>
  );
}

export function InviteModal({
  open,
  onClose,
  calendarId,
  createDraft,
  sendInvite,
}: CalendarMutations & {
  open: boolean;
  onClose: () => void;
  calendarId: string;
}) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState(() => getDefaultEventTimes().start);
  const [end, setEnd] = useState(() => getDefaultEventTimes().end);
  const [attendees, setAttendees] = useState("");

  useEffect(() => {
    if (!open) return;
    const defaults = getDefaultEventTimes();
    setSummary("");
    setDescription("");
    setLocation("");
    setAttendees("");
    setStart(defaults.start);
    setEnd(defaults.end);
  }, [open]);

  function parseAttendees() {
    return attendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  const eventInput = {
    summary: summary.trim(),
    description: description.trim() || undefined,
    location: location.trim() || undefined,
    start: start.toISOString(),
    end: end.toISOString(),
    attendees: parseAttendees(),
    calendarId,
  };

  function handleSuccess() {
    onClose();
  }

  const isPending = createDraft.isPending || sendInvite.isPending;
  const error = createDraft.error ?? sendInvite.error;
  const guestList = parseAttendees();
  const isValid =
    summary.trim().length > 0 && !isEndBeforeOrEqualStart(start, end);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className={eventDialogContentClass}>
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-5 pr-14">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Create event
          </DialogTitle>
          <DialogDescription>
            Schedule a meeting and optionally invite guests by email.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
          <div className="grid min-w-0 gap-5">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="event-title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="event-title"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Team sync, client call, lunch…"
                autoFocus
                className="h-10"
              />
            </div>

            <EventDateTimeRange
              start={start}
              end={end}
              onStartChange={setStart}
              onEndChange={setEnd}
              disabled={isPending}
            />

            <FormSection title="Details">
              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="event-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Agenda, notes, or meeting link details"
                  className="min-h-[5.5rem] resize-none"
                />
              </div>

              <EventLocationField
                value={location}
                onChange={setLocation}
                disabled={isPending}
              />
            </FormSection>

            <FormSection>
              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="event-attendees" className="text-sm font-medium">
                  Guests
                </Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="event-attendees"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder="email@example.com, teammate@company.com"
                    className="h-10 pl-9"
                  />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Separate multiple emails with commas. Required to send invites.
                </p>
              </div>
            </FormSection>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/30 px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="sm:mr-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              createDraft.mutate(eventInput, { onSuccess: handleSuccess })
            }
            disabled={isPending || !isValid}
          >
            {createDraft.isPending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            className={cn(calendarUi.primaryButton, "min-w-[7.5rem]")}
            onClick={() =>
              sendInvite.mutate(
                { ...eventInput, attendees: guestList },
                { onSuccess: handleSuccess },
              )
            }
            disabled={isPending || !isValid || guestList.length === 0}
          >
            {sendInvite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
