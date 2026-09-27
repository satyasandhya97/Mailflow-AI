"use client";

import { memo, useState } from "react";
import { Plug, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PluginStatusBadge } from "@/features/plugins/components/plugin-status-badge";
import type {
  PluginCatalogItem,
  PluginConnectionStatus,
  PluginSettings,
} from "@/features/plugins/types/plugin.types";
import { cn } from "@/lib/utils";

type PluginCardProps = {
  plugin: PluginCatalogItem;
  status: PluginConnectionStatus;
  settings: PluginSettings;
  onConnect: () => void;
  onRemove: () => void;
  onSettingsChange: (patch: Partial<PluginSettings>) => void;
  isConnecting?: boolean;
};

export const PluginCard = memo(function PluginCard({
  plugin,
  status,
  settings,
  onConnect,
  onRemove,
  onSettingsChange,
  isConnecting = false,
}: PluginCardProps) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const Icon = plugin.icon;
  const needsConnection = status === "needs_connection";

  return (
    <>
      <Card
        className={cn(
          "gap-0 overflow-hidden border-t-4 py-0 shadow-sm bg-card",
          plugin.accentClass,
        )}
      >
        <CardHeader className="gap-3 border-b border-border/60 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  plugin.iconBgClass,
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{plugin.name}</h3>
                  <PluginStatusBadge status={status} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      plugin.categoryDotClass,
                    )}
                    aria-hidden
                  />
                  <span>{plugin.categoryLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 py-4 flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {plugin.description}
          </p>

          {needsConnection ? (
            <Button
            size={"lg"}
              className="mt-4 w-full "
              onClick={onConnect}
              disabled={isConnecting}
            >
              <Plug />
              {isConnecting ? `Connecting ${plugin.name}...` : `Connect ${plugin.name}`}
            </Button>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`${plugin.id}-enabled`} className="text-sm">
                  Enabled
                </Label>
                <Switch
                  id={`${plugin.id}-enabled`}
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => onSettingsChange({ enabled })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor={`${plugin.id}-agent`}
                  className={cn(
                    "text-sm",
                    !settings.enabled && "text-muted-foreground",
                  )}
                >
                  Agent access
                </Label>
                <Switch
                  id={`${plugin.id}-agent`}
                  checked={settings.enabled && settings.agentAccess}
                  disabled={!settings.enabled}
                  onCheckedChange={(agentAccess) =>
                    onSettingsChange({ agentAccess })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end bg-card  px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setRemoveOpen(true)}
          >
            <Trash2 />
            Remove
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {plugin.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the plugin from your workspace and hide it from
              the sidebar. You can add it again from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onRemove();
                setRemoveOpen(false);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
