"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarEventDetailToolbar } from "@/features/calendar/components/calendar-event-detail-toolbar";
import { CalendarEventDetailView } from "@/features/calendar/components/calendar-event-detail-view";
import { CalendarEventEditDialog } from "@/features/calendar/components/calendar-event-edit-dialog";
import { CalendarEventDetailSkeleton } from "@/features/calendar/components/skeletons/calendar-event-detail-skeleton";
import { useCalendar } from "@/features/calendar/context/calendar-provider";
import { useCalendarActions } from "@/features/calendar/hooks/use-calendar-actions";
import { CALENDAR_EVENT_STALE_MS } from "@/features/calendar/lib/calendar-query-options";
import {
  calendarEventHref,
  calendarWeekHref,
} from "@/features/calendar/lib/calendar-routes";
import { resolveCalendarPaletteById } from "@/features/calendar/lib/calendar-theme";
import { api } from "@/trpc/react";

type CalendarEventPageProps = {
  eventId: string;
};

export function CalendarEventPage({ eventId }: CalendarEventPageProps) {
  const router = useRouter();
  const { calendarId, eventsList, calendarList } = useCalendar();
  const actions = useCalendarActions();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const event = api.calendar.getEvent.useQuery(
    { id: eventId, calendarId },
    { staleTime: CALENDAR_EVENT_STALE_MS },
  );

  const palette = resolveCalendarPaletteById(
    calendarId,
    calendarList.map((c) => c.id),
  );

  const navTargets = useMemo(() => {
    const idx = eventsList.findIndex((e) => e.id === eventId);
    return {
      prev: idx > 0 ? eventsList[idx - 1] : undefined,
      next:
        idx >= 0 && idx < eventsList.length - 1
          ? eventsList[idx + 1]
          : undefined,
      index: idx >= 0 ? idx + 1 : 1,
      total: eventsList.length || 1,
    };
  }, [eventsList, eventId]);

  const handleDelete = () => {
    actions.deleteEvent.mutate(
      { id: eventId, calendarId },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          router.push(calendarWeekHref());
        },
      },
    );
  };

  if (event.isLoading) {
    return <CalendarEventDetailSkeleton />;
  }

  if (event.error || !event.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {event.error?.message ?? "Event not found"}
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-[var(--cream-lifted)] shadow-sm">
        <CalendarEventDetailToolbar
          onBack={() => router.push(calendarWeekHref())}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          htmlLink={event.data.htmlLink}
          eventIndex={navTargets.index}
          eventTotal={navTargets.total}
          onPrev={
            navTargets.prev
              ? () => router.push(calendarEventHref(navTargets.prev!.id))
              : undefined
          }
          onNext={
            navTargets.next
              ? () => router.push(calendarEventHref(navTargets.next!.id))
              : undefined
          }
          actionsPending={actions.isPending}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <CalendarEventDetailView
            event={event.data}
            accentColor={palette.color}
          />
        </div>
      </div>

      <CalendarEventEditDialog
        open={editOpen}
        event={event.data}
        calendarId={calendarId}
        onClose={() => setEditOpen(false)}
        updateEvent={actions.updateEvent}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{event.data.summary}&rdquo;
              from your Google Calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actions.deleteEvent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actions.deleteEvent.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
