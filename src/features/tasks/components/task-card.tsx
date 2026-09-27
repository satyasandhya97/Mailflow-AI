"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  GripVertical,
  LoaderCircle,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { TaskCountdownBar } from "@/features/tasks/components/task-countdown-bar";
import { TaskCountdownTimer } from "@/features/tasks/components/task-countdown-timer";
import { TaskRunningTimer } from "@/features/tasks/components/task-running-timer";
import { useTaskRun } from "@/features/tasks/hooks/use-task-run";
import { shouldShowCountdown } from "@/features/tasks/lib/task-due";
import {
  formatDueLabel,
  formatScheduleLabel,
} from "@/features/tasks/lib/task-schedule";
import type { TaskPriority, WorkspaceTask } from "@/features/tasks/types/task.types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type TaskCardProps = {
  task: WorkspaceTask;
  onOpen: (task: WorkspaceTask) => void;
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; className: string } | null
> = {
  low: null,
  normal: null,
  high: {
    label: "High",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
  },
  urgent: {
    label: "Urgent",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
  },
};

export function TaskCard({ task, onOpen }: TaskCardProps) {
  const utils = api.useUtils();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });

  const invalidate = async () => {
    await utils.tasks.listBoard.invalidate();
    await utils.tasks.countActive.invalidate();
  };

  const deleteMutation = api.tasks.delete.useMutation({
    onSuccess: async () => {
      await invalidate();
      toast.success("Task deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const runNowMutation = useTaskRun();

  const pauseMutation = api.tasks.setPaused.useMutation({
    onSuccess: async (_data, variables) => {
      await invalidate();
      toast.success(variables.paused ? "Task paused" : "Task resumed");
    },
    onError: (error) => toast.error(error.message),
  });

  const isAgent = task.type === "agent";
  const isRunning = task.status === "in_progress";
  const isDone = task.status === "done";
  const hasError = Boolean(task.lastRunError);
  const isPaused = task.paused;
  const isEventTrigger = isAgent && task.triggerType === "event";
  const scheduleLabel = formatScheduleLabel(task);
  const eventLabel = isEventTrigger
    ? task.eventSource === "calendar"
      ? "On calendar change"
      : `On new email${task.eventFilter.from ? ` · ${task.eventFilter.from}` : ""}`
    : null;
  const showCountdown = shouldShowCountdown(task) && !hasError;
  const due = formatDueLabel(task.dueAt);
  const showRetry =
    isAgent && hasError && !isDone && task.attempts > 0 && task.maxRetries > 0;
  const priorityMeta = PRIORITY_META[task.priority];

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
    <Card
      size="sm"
      className={cn(
        "group relative overflow-hidden py-0 ring-border/70 transition-all hover:shadow-md",
        "before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-1 before:content-['']",
        isAgent ? "before:bg-primary/70" : "before:bg-slate-400/60",
        isPaused && "before:bg-muted-foreground/40 opacity-80",
        isDragging && "rotate-1 opacity-60 shadow-lg ring-2 ring-primary/20",
        isRunning && isAgent && "ring-2 ring-amber-400/40",
      )}
    >
      <CardContent className="p-0">
      <div className="flex items-start gap-2 p-3 pl-4">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing"
          aria-label="Drag task"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(task)}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium text-foreground">{task.title}</p>
            <Badge
              variant={isAgent ? "secondary" : "outline"}
              className="gap-1"
            >
              {isAgent ? (
                <Bot className="size-3" />
              ) : (
                <User className="size-3" />
              )}
              {isAgent ? "Agent" : "Manual"}
            </Badge>
            {priorityMeta ? (
              <Badge variant="outline" className={priorityMeta.className}>
                {priorityMeta.label}
              </Badge>
            ) : null}
            {isPaused ? (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Pause className="size-3" />
                Paused
              </Badge>
            ) : null}
          </div>

          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {scheduleLabel ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3" />
                {scheduleLabel}
              </span>
            ) : null}

            {eventLabel ? (
              <span className="inline-flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400">
                <Zap className="size-3" />
                {eventLabel}
              </span>
            ) : null}

            {due ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  due.overdue
                    ? "font-medium text-red-600 dark:text-red-400"
                    : due.soon
                      ? "font-medium text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                )}
              >
                <CalendarClock className="size-3" />
                {due.label}
              </span>
            ) : null}

            {showRetry ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <RotateCcw className="size-3" />
                Retry {task.attempts}/{task.maxRetries}
              </span>
            ) : null}

            {isRunning && isAgent ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                <LoaderCircle className="size-3 animate-spin" />
                Running
                <TaskRunningTimer
                  startedAt={task.updatedAt}
                  className="tabular-nums text-amber-600/80 dark:text-amber-400/80"
                />
              </span>
            ) : null}

            {isDone && task.completedAt ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Completed {format(task.completedAt, "MMM d, h:mm a")}
              </span>
            ) : null}

            {showCountdown ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/5 px-2 py-0.5 font-medium text-primary">
                <Clock className="size-3" />
                Runs
                <TaskCountdownTimer
                  nextRunAt={task.nextRunAt}
                  className="tabular-nums"
                />
              </span>
            ) : null}
          </div>

          {task.labels.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {hasError ? (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">{task.lastRunError}</span>
            </div>
          ) : null}
        </button>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAgent ? (
              <DropdownMenuItem
                onClick={() => runNowMutation.mutate({ taskId: task.id })}
                disabled={runNowMutation.isPending || isRunning}
              >
                {hasError ? (
                  <RotateCcw className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {hasError ? "Retry now" : "Run now"}
              </DropdownMenuItem>
            ) : null}

            {isAgent && !isDone ? (
              <DropdownMenuItem
                onClick={() =>
                  pauseMutation.mutate({
                    taskId: task.id,
                    paused: !isPaused,
                  })
                }
                disabled={pauseMutation.isPending}
              >
                {isPaused ? (
                  <Play className="size-4" />
                ) : (
                  <Pause className="size-4" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => deleteMutation.mutate({ taskId: task.id })}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showCountdown && task.nextRunAt ? (
        <div className="border-t border-border/50 px-3 py-2.5">
          <TaskCountdownBar nextRunAt={task.nextRunAt} />
        </div>
      ) : null}

      {isRunning && isAgent ? (
        <div className="px-3 pb-3">
          <Progress value={null} className="gap-0">
            <ProgressTrack className="h-1 overflow-hidden bg-amber-100 dark:bg-amber-950">
              <ProgressIndicator className="w-1/3 animate-[task-progress_1.2s_ease-in-out_infinite] bg-amber-500" />
            </ProgressTrack>
          </Progress>
        </div>
      ) : null}

      <CreateTaskDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
      </CardContent>
    </Card>
    </div>
  );
}
