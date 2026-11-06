import { SidebarProvider } from "@/components/ui/sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { PluginWorkspaceProvider } from "@/features/plugins/context/plugin-workspace-provider";
import { AgentConversationsProvider } from "@/features/agent/context/agent-conversations-provider";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider defaultOpen={true}>
      <PluginWorkspaceProvider>
        <AgentConversationsProvider>
          <AppShell>{children}</AppShell>
        </AgentConversationsProvider>
      </PluginWorkspaceProvider>
    </SidebarProvider>
  );
}
