"use client";

import Link from "next/link";

import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { StaticNavItem } from "@/features/navigation/nav-config";
import type { SidebarPluginNavItem } from "@/features/plugins/types/plugin.types";
import { api } from "@/trpc/react";

type NavItem = StaticNavItem | SidebarPluginNavItem;

function isActivePath(pathname: string, href: string) {
  const basePath = href.split("?")[0] ?? href;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function TasksActiveBadge() {
  const countQuery = api.tasks.countActive.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const count = countQuery.data ?? 0;
  if (count <= 0) return null;
  return <SidebarMenuBadge>{count}</SidebarMenuBadge>;
}

export function NavSidebarLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        render={<Link href={item.href} />}
      >
        <Icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
      {item.href === "/tasks" ? (
        <TasksActiveBadge />
      ) : item.badge != null ? (
        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}
