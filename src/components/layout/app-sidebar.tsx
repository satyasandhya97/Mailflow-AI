"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddPluginSheet } from "@/features/plugins/components/add-plugin-sheet";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavSidebarLink } from "@/features/navigation/components/nav-sidebar-link";
import {
  automationNavItem,
  primaryStaticNavItems,
  secondaryStaticNavItems,
} from "@/features/navigation/nav-config";
import { useEnabledPlugins } from "@/features/plugins/hooks/use-enabled-plugins";

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarItems } = useEnabledPlugins();
  const [addPluginOpen, setAddPluginOpen] = useState(false);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-3 ">
        <SidebarMenu>
          <SidebarMenuItem className="flex group-data-[collapsible=icon]:flex-col gap-2 items-center justify-between">
            <SidebarMenuButton
              size="lg"
              tooltip="Mailflow AI"
              className="hover:bg-transparent h-18 active:bg-transparent  flex items-center justify-start "
              render={<Link href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <span className="truncate font-semibold">Mailflow AI</span>
            </SidebarMenuButton>
            <SidebarTrigger className="-ml-1" />

          </SidebarMenuItem>
        </SidebarMenu>
        <Button
          type="button"
          size={"icon"}
          className=" h-10 w-full rounded-full  group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-0 gap-2"
          onClick={() => setAddPluginOpen(true)}
        >
          <Plus className="group-data-[collapsible=icon]:mr-0 " />
          <span className="group-data-[collapsible=icon]:hidden">Add Plugin</span>
        </Button>

        <AddPluginSheet open={addPluginOpen} onOpenChange={setAddPluginOpen} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryStaticNavItems.map((item) => (
                <NavSidebarLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))}
              {sidebarItems.map((item) => (
                <NavSidebarLink
                  key={item.pluginId}
                  item={item}
                  pathname={pathname}
                />
              ))}
              {secondaryStaticNavItems.map((item) => (
                <NavSidebarLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Automation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavSidebarLink item={automationNavItem} pathname={pathname} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarUserMenu />
      </SidebarFooter>

      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
