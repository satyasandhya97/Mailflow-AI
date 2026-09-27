import {
  Bot,
  ListTodo,
  Plug,
  Sun,
  type LucideIcon,
} from "lucide-react";

export type StaticNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export const primaryStaticNavItems: StaticNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Sun,
  },
];

export const secondaryStaticNavItems: StaticNavItem[] = [
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Agent",
    href: "/agent",
    icon: Bot,
  },
];

export const automationNavItem: StaticNavItem = {
  title: "Plugins",
  href: "/plugins",
  icon: Plug,
  badge: 7,
};
