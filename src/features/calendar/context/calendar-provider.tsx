"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CALENDAR_LIST_STALE_MS,
  CALENDAR_META_STALE_MS,
} from "@/features/calendar/lib/calendar-query-options";
import { formatWeekLabel, getWeekBounds } from "@/features/calendar/lib/week";
import type { CalendarEvent, CalendarListItem } from "@/features/calendar/types";
import { api } from "@/trpc/react";

type CalendarContextValue = {
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  week: ReturnType<typeof getWeekBounds>;
  weekLabel: string;
  weekStartIso: string;
  weekEndIso: string;
  calendarId: string;
  setCalendarId: (id: string) => void;
  inviteOpen: boolean;
  openInvite: () => void;
  closeInvite: () => void;
  eventsList: CalendarEvent[];
  eventsLoading: boolean;
  eventsError: { message: string } | null;
  calendarList: CalendarListItem[];
  calendarsLoading: boolean;
  refreshEvents: ReturnType<typeof api.calendar.refreshEvents.useMutation>;
  createDraft: ReturnType<typeof api.calendar.createDraft.useMutation>;
  sendInvite: ReturnType<typeof api.calendar.sendInvite.useMutation>;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarId, setCalendarId] = useState("primary");
  const [inviteOpen, setInviteOpen] = useState(false);

  const week = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const weekLabel = useMemo(
    () => formatWeekLabel(week.start, week.end),
    [week.start, week.end],
  );
  const weekStartIso = week.start.toISOString();
  const weekEndIso = week.end.toISOString();

  const utils = api.useUtils();

  const calendarsQuery = api.calendar.listCalendars.useQuery(undefined, {
    staleTime: CALENDAR_META_STALE_MS,
    gcTime: CALENDAR_META_STALE_MS * 2,
  });

  const eventsQuery = api.calendar.searchEvents.useQuery(
    {
      query: "",
      weekStart: weekStartIso,
      weekEnd: weekEndIso,
      calendarId,
      limit: 100,
      offset: 0,
    },
    {
      staleTime: CALENDAR_LIST_STALE_MS,
      placeholderData: (previous) => previous,
    },
  );

  const refreshEvents = api.calendar.refreshEvents.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
    },
  });

  const createDraft = api.calendar.createDraft.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
    },
  });

  const sendInvite = api.calendar.sendInvite.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
    },
  });

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);

  const eventsList = useMemo(
    () => eventsQuery.data ?? [],
    [eventsQuery.data],
  );

  const calendarList = useMemo(
    () => calendarsQuery.data ?? [],
    [calendarsQuery.data],
  );

  const value = useMemo(
    () => ({
      weekOffset,
      setWeekOffset,
      week,
      weekLabel,
      weekStartIso,
      weekEndIso,
      calendarId,
      setCalendarId,
      inviteOpen,
      openInvite,
      closeInvite,
      eventsList,
      eventsLoading: eventsQuery.isLoading && !eventsQuery.data,
      eventsError: eventsQuery.error ?? null,
      calendarList,
      calendarsLoading: calendarsQuery.isLoading,
      refreshEvents,
      createDraft,
      sendInvite,
    }),
    [
      weekOffset,
      week,
      weekLabel,
      weekStartIso,
      weekEndIso,
      calendarId,
      inviteOpen,
      openInvite,
      closeInvite,
      eventsList,
      eventsQuery.isLoading,
      eventsQuery.data,
      eventsQuery.error,
      calendarList,
      calendarsQuery.isLoading,
      refreshEvents,
      createDraft,
      sendInvite,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
}
