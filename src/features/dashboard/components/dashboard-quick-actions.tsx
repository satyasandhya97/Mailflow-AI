"use client";

import Link from "next/link";
import {
  Bot,
  CalendarPlus,
  ListPlus,
  Plug,
  SquarePen,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { gmailComposeHref } from "@/features/gmail/lib/gmail-routes";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Compose email",
    href: gmailComposeHref("/gmail/inbox"),
    icon: SquarePen,
  },
  { label: "New event", href: "/calendar", icon: CalendarPlus },
  { label: "New task", href: "/tasks", icon: ListPlus },
  { label: "Ask the agent", href: "/agent", icon: Bot },
  { label: "Manage plugins", href: "/plugins", icon: Plug },
];

export function DashboardQuickActions() {
  return (
    <Card className="ring-0 shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-medium">Quick actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <action.icon className="size-4" />
              </span>
              <span className="font-medium leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
