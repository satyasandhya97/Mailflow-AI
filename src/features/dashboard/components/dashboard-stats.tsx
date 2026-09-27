"use client";

import { CalendarClock, CalendarDays, FileText, ListTodo } from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import { StatCardSkeleton } from "@/features/dashboard/components/skeletons";
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";
import { selectTodaysEvents } from "@/features/dashboard/lib/dashboard-data";

export function DashboardStats() {
  const { events, activeTasks, draftCount, calendarConnected, gmailConnected } =
    useDashboardData();

  const isLoading =
    activeTasks.isLoading ||
    (calendarConnected && events.isLoading) ||
    (gmailConnected && draftCount.isLoading);

  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </section>
    );
  }

  const todaysEvents = selectTodaysEvents(events.data ?? []);
  const weekEventCount = events.data?.length ?? 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={CalendarClock}
        label="Events today"
        value={todaysEvents.length}
        href="/calendar"
        tone="marine"
      />
      <StatCard
        icon={CalendarDays}
        label="Events this week"
        value={weekEventCount}
        href="/calendar"
        tone="gold"
      />
      <StatCard
        icon={ListTodo}
        label="Active tasks"
        value={activeTasks.data ?? 0}
        href="/tasks"
        tone="brand"
      />
      <StatCard
        icon={FileText}
        label="Drafts"
        value={draftCount.data ?? 0}
        href="/gmail/drafts"
        tone="sage"
      />
    </section>
  );
}
