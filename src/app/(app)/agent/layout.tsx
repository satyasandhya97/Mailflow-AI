import { AgentConversationsProvider } from "@/features/agent/context/agent-conversations-provider";
import { AgentShellLayout } from "@/features/agent/layouts/agent-shell-layout";

export default function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AgentConversationsProvider>
      <AgentShellLayout>{children}</AgentShellLayout>
    </AgentConversationsProvider>
  );
}
