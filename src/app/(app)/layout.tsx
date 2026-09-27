import { SidebarProvider } from "@/components/ui/sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { PluginWorkspaceProvider } from "@/features/plugins/context/plugin-workspace-provider";
import { TaskAutoRunProvider } from "@/features/tasks/components/task-auto-run-provider";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider defaultOpen={false}>
      <PluginWorkspaceProvider>
        <TaskAutoRunProvider>
          <AppShell>{children}</AppShell>
        </TaskAutoRunProvider>
      </PluginWorkspaceProvider>
    </SidebarProvider>
  );
}
