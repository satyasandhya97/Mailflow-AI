"use client";

import { DashboardAgenda } from "@/features/dashboard/components/dashboard-agenda";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardPluginStatus } from "@/features/dashboard/components/dashboard-plugin-status";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { DashboardRecentEmail } from "@/features/dashboard/components/dashboard-recent-email";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";

export function DashboardView() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <DashboardHeader />
      <DashboardStats />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DashboardAgenda />
          <DashboardRecentEmail />
        </div>
        <div className="space-y-4">
          <DashboardQuickActions />
          <DashboardPluginStatus />
        </div>
      </div>
    </div>
  );
}
