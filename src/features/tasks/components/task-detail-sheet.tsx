"use client";

import { format } from "date-fns";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatScheduleLabel } from "@/features/tasks/lib/task-schedule";
import type { WorkspaceTask } from "@/features/tasks/types/task.types";
import { api } from "@/trpc/react";

type TaskDetailSheetProps = {
  task: WorkspaceTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const runsQuery = api.tasks.listRuns.useQuery(
    { taskId: task?.id ?? "" },
    { enabled: open && task?.type === "agent" && Boolean(task?.id) },
  );

  if (!task) return null;

  const scheduleLabel = formatScheduleLabel(task);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>
            {task.type === "agent" ? "Automated agent task" : "Manual task"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {task.status.replace("_", " ")}
            </Badge>
            {task.type === "agent" ? <Badge variant="secondary">Agent</Badge> : null}
            {task.priority !== "normal" ? (
              <Badge variant="outline" className="capitalize">
                {task.priority} priority
              </Badge>
            ) : null}
            {task.paused ? <Badge variant="outline">Paused</Badge> : null}
            {task.type === "agent" && task.triggerType === "event" ? (
              <Badge variant="outline">
                {task.eventSource === "calendar"
                  ? "On calendar change"
                  : "On new email"}
              </Badge>
            ) : null}
            {task.type === "agent" && task.outputDelivery === "email" ? (
              <Badge variant="outline">Emails result</Badge>
            ) : null}
          </div>

          {task.labels.length ? (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {task.dueAt ? (
            <p className="text-sm text-muted-foreground">
              Due · {format(task.dueAt, "MMM d, yyyy h:mm a")}
            </p>
          ) : null}

          {task.description ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="text-sm">{task.description}</p>
            </div>
          ) : null}

          {task.instructions ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Agent instructions
              </p>
              <p className="rounded-lg bg-muted/50 p-3 text-sm">{task.instructions}</p>
            </div>
          ) : null}

          {scheduleLabel ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Schedule
              </p>
              <p className="text-sm">{scheduleLabel}</p>
            </div>
          ) : null}

          {task.nextRunAt ? (
            <p className="text-sm text-muted-foreground">
              Next run · {format(task.nextRunAt, "MMM d, yyyy h:mm a")}
            </p>
          ) : null}

          {task.lastRunAt ? (
            <p className="text-sm text-muted-foreground">
              Last run · {format(task.lastRunAt, "MMM d, yyyy h:mm a")}
            </p>
          ) : null}

          {task.type === "agent" ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent runs
              </p>
              {runsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading runs…</p>
              ) : runsQuery.data?.length ? (
                runsQuery.data.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg border border-border/70 p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          run.status === "success" ? "secondary" : "destructive"
                        }
                      >
                        {run.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(run.startedAt, "MMM d, h:mm a")}
                      </span>
                    </div>
                    {run.output ? (
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {run.output}
                      </p>
                    ) : null}
                    {run.error ? (
                      <p className="text-destructive">{run.error}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No runs yet.</p>
              )}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
