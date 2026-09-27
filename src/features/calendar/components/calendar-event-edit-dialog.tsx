"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventDateTimeRange } from "@/features/calendar/components/event-datetime-range";
import { EventLocationField } from "@/features/calendar/components/event-location-field";
import {
  isEndBeforeOrEqualStart,
} from "@/features/calendar/lib/calendar-datetime.utils";
import { eventDialogContentClass } from "@/features/calendar/lib/calendar-theme";
import type { CalendarEventDetail } from "@/features/calendar/types";
import type { useCalendarActions } from "@/features/calendar/hooks/use-calendar-actions";

type UpdateMutation = ReturnType<typeof useCalendarActions>["updateEvent"];

function parseEventDate(iso: string): Date {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

type CalendarEventEditDialogProps = {
  open: boolean;
  event: CalendarEventDetail;
  calendarId: string;
  onClose: () => void;
  updateEvent: UpdateMutation;
};

export function CalendarEventEditDialog({
  open,
  event,
  calendarId,
  onClose,
  updateEvent,
}: CalendarEventEditDialogProps) {
  const [summary, setSummary] = useState(event.summary);
  const [description, setDescription] = useState(event.description);
  const [location, setLocation] = useState(event.location);
  const [start, setStart] = useState(() => parseEventDate(event.start));
  const [end, setEnd] = useState(() => parseEventDate(event.end));
  const [attendees, setAttendees] = useState(event.attendees.join(", "));

  useEffect(() => {
    if (open) {
      setSummary(event.summary);
      setDescription(event.description);
      setLocation(event.location);
      setStart(parseEventDate(event.start));
      setEnd(parseEventDate(event.end));
      setAttendees(event.attendees.join(", "));
    }
  }, [open, event]);

  function parseAttendees() {
    return attendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  function handleSave() {
    updateEvent.mutate(
      {
        id: event.id,
        calendarId,
        summary: summary.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start: start.toISOString(),
        end: end.toISOString(),
        attendees: parseAttendees(),
      },
      { onSuccess: () => onClose() },
    );
  }

  const isValid =
    summary.trim().length > 0 && !isEndBeforeOrEqualStart(start, end);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className={eventDialogContentClass}>
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5 pr-14">
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
          <div className="grid min-w-0 gap-5">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="h-10"
              />
            </div>

            <EventDateTimeRange
              start={start}
              end={end}
              onStartChange={setStart}
              onEndChange={setEnd}
              disabled={updateEvent.isPending}
            />

            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="min-h-[5.5rem] resize-none"
              />
            </div>

            <EventLocationField
              id="edit-location"
              value={location}
              onChange={setLocation}
              disabled={updateEvent.isPending}
            />

            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="edit-attendees">Guests</Label>
              <Input
                id="edit-attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="email@example.com, …"
                className="h-10"
              />
            </div>
          </div>
        </div>

        {updateEvent.error && (
          <p className="shrink-0 px-5 text-sm text-destructive">
            {updateEvent.error.message}
          </p>
        )}

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/30 px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} className="sm:mr-auto">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateEvent.isPending || !isValid}
          >
            {updateEvent.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
