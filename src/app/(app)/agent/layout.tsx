import { AgentShellLayout } from "@/features/agent/layouts/agent-shell-layout";

export default function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AgentShellLayout>{children}</AgentShellLayout>;
}
