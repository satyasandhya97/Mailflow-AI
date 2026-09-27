"use client";

import { useMemo } from "react";

import { getWeekBounds } from "@/features/calendar/lib/week";
import { DEFAULT_INSTALLED_PLUGIN_IDS } from "@/features/plugins/enabled-plugins";
import { api } from "@/trpc/react";

/**
 * Centralizes every dashboard query so presentational components stay dumb.
 * React Query dedupes by key, so calling this hook from multiple components
 * shares a single request per query.
 */
export function useDashboardData() {
  const weekBounds = useMemo(() => {
    const { start, end } = getWeekBounds();
    return { weekStart: start.toISOString(), weekEnd: end.toISOString() };
  }, []);

  const me = api.auth.me.useQuery();
  const integrations = api.integrations.getStatus.useQuery({
    pluginIds: [...DEFAULT_INSTALLED_PLUGIN_IDS],
  });

  const gmailConnected = integrations.data?.gmail === "connected";
  const calendarConnected = integrations.data?.googlecalendar === "connected";

  const activeTasks = api.tasks.countActive.useQuery();

  const draftCount = api.gmail.getDraftCount.useQuery(undefined, {
    enabled: gmailConnected,
  });

  const recentEmail = api.gmail.searchEmails.useQuery(
    { query: "", limit: 5 },
    { enabled: gmailConnected },
  );

  const events = api.calendar.searchEvents.useQuery(
    { query: "", limit: 100, ...weekBounds },
    { enabled: calendarConnected },
  );

  return {
    me,
    integrations,
    gmailConnected,
    calendarConnected,
    activeTasks,
    draftCount,
    recentEmail,
    events,
  };
}
