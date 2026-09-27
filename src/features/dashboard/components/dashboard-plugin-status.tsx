"use client";

import Link from "next/link";
import { Calendar, Mail, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";

type PluginRow = {
  id: "gmail" | "googlecalendar";
  label: string;
  icon: LucideIcon;
};

const PLUGINS: PluginRow[] = [
  { id: "gmail", label: "Gmail", icon: Mail },
  { id: "googlecalendar", label: "Google Calendar", icon: Calendar },
];

export function DashboardPluginStatus() {
  const { integrations } = useDashboardData();

  return (
    <Card className="ring-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b pb-3">
        <CardTitle className="text-sm font-medium">Connections</CardTitle>
        <Link
          href="/plugins"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {PLUGINS.map((plugin) => {
          const connected = integrations.data?.[plugin.id] === "connected";

          return (
            <div
              key={plugin.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <plugin.icon className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{plugin.label}</span>
              {integrations.isLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : connected ? (
                <Badge variant="secondary" className="gap-1.5">
                  <span className="size-1.5 rounded-full bg-[var(--success)]" />
                  Connected
                </Badge>
              ) : (
                <Link href="/plugins">
                  <Badge variant="outline">Connect</Badge>
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
