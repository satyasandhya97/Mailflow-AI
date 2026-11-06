"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plug, Search, Sparkles, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AgentChatHistoryList } from "@/features/agent/components/agent-chat-history-list";
import { AgentChatSearchDialog } from "@/features/agent/components/agent-chat-search-dialog";
import { useAgentConversationsContext } from "@/features/agent/context/agent-conversations-provider";
import { usePluginWorkspace } from "@/features/plugins/context/plugin-workspace-provider";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);

  const {
    conversations,
    activeId,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useAgentConversationsContext();

  const { isInstalled, state, isHydrated } = usePluginWorkspace();

  const connectedCount = useMemo(() => {
    if (!isHydrated) return 0;
    return (["gmail", "googlecalendar"] as const).filter(
      (pluginId) =>
        isInstalled(pluginId) && state.connections[pluginId] === "connected",
    ).length;
  }, [isHydrated, isInstalled, state.connections]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleNewChat() {
    await createConversation();
    if (pathname !== "/agent") {
      router.push("/agent");
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  function handleSelectChat(id: string) {
    selectConversation(id);
    if (pathname !== "/agent") {
      router.push("/agent");
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const isPluginsActive = pathname.startsWith("/plugins");

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" className="border-r border-sidebar-border">
        {/* Brand Header */}
        <SidebarHeader className="p-3 gap-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
          <SidebarMenu className="w-full">
            <SidebarMenuItem className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
              <SidebarMenuButton
                size="lg"
                tooltip="Mailflow AI"
                className="hover:bg-transparent active:bg-transparent h-9 px-1.5 flex items-center justify-start gap-2.5 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                render={<Link href="/agent" />}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <span className="truncate font-semibold text-sm tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                  Mailflow AI
                </span>
              </SidebarMenuButton>

              {/* Toggle button: on right when expanded, below logo when collapsed */}
              <SidebarTrigger
                title="Toggle sidebar"
                className="shrink-0 size-7 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:hover:bg-sidebar-accent"
              />
            </SidebarMenuItem>
          </SidebarMenu>

          {/* 1. New Chat Button */}
          <div className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <Button
              type="button"
              className="w-full justify-start gap-2.5 h-9 rounded-lg px-3 font-medium shadow-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              onClick={handleNewChat}
              title="New chat"
            >
              <SquarePen className="size-4 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">
                New chat
              </span>
            </Button>
          </div>

          {/* 2. Search Button */}
          <div className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2.5 h-9 rounded-lg border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3 font-normal text-muted-foreground shadow-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              onClick={() => setSearchOpen(true)}
              title="Search chats"
            >
              <Search className="size-4 shrink-0" />
              <span className="truncate flex-1 text-left group-data-[collapsible=icon]:hidden">
                Search chats
              </span>
              <kbd className="hidden rounded border border-sidebar-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline group-data-[collapsible=icon]:hidden">
                ⌘K
              </kbd>
            </Button>
          </div>

          {/* 3. Plugins Button/Section */}
          <div className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <Link
              href="/plugins"
              title="Plugins"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 h-9 rounded-lg px-3 text-sm font-medium transition-colors group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
                isPluginsActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Plug className="size-4 shrink-0" />
              <span className="flex-1 truncate text-left group-data-[collapsible=icon]:hidden">
                Plugins
              </span>
              {connectedCount > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary group-data-[collapsible=icon]:hidden">
                  {connectedCount}
                </span>
              )}
            </Link>
          </div>
        </SidebarHeader>

        {/* 4. Chat History */}
        <SidebarContent className="px-2 py-1 overflow-hidden group-data-[collapsible=icon]:hidden">
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Chats
            </div>
            <AgentChatHistoryList
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelectChat}
              onDelete={deleteConversation}
              onRename={renameConversation}
            />
          </div>
        </SidebarContent>

        {/* Footer User Menu */}
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarUserMenu />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Global Search Dialog */}
      <AgentChatSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        onSelect={handleSelectChat}
        onCreate={handleNewChat}
      />
    </>
  );
}
