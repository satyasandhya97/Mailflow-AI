import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PluginConnectionStatus } from "@/features/plugins/types/plugin.types";

const STATUS_CONFIG: Record<
  PluginConnectionStatus,
  { label: string; className: string }
> = {
  connected: {
    label: "Connected",
    className:
      "border-transparent bg-[var(--success-tint)] text-[var(--success)]",
  },
  needs_connection: {
    label: "Needs connection",
    className:
      "border-transparent bg-[var(--ember-100)] text-[var(--ember-700)]",
  },
  not_installed: {
    label: "Not installed",
    className: "border-transparent bg-muted text-muted-foreground",
  },
};

export function PluginStatusBadge({
  status,
  className,
}: {
  status: PluginConnectionStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
