"use client";

import {
  Bot,
  CalendarClock,
  Clock,
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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { TaskCountdownTimer } from "@/features/tasks/components/task-countdown-timer";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskRunningTimer } from "@/features/tasks/components/task-running-timer";
import { useTaskRun } from "@/features/tasks/hooks/use-task-run";
import { flattenBoard } from "@/features/tasks/lib/task-board";
import { shouldShowCountdown } from "@/features/tasks/lib/task-due";
import {
  formatDueLabel,
  formatScheduleLabel,
} from "@/features/tasks/lib/task-schedule";
import type {
  TaskBoard,
  TaskStatus,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "To Do", className: "text-muted-foreground" },
  in_progress: {
    label: "In Progress",
    className: "text-amber-600 dark:text-amber-400",
  },
  done: { label: "Done", className: "text-emerald-600 dark:text-emerald-400" },
};

function TaskListRow({
  task,
  onOpen,
  onEdit,
}: {
  task: WorkspaceTask;
  onOpen: (task: WorkspaceTask) => void;
  onEdit: (task: WorkspaceTask) => void;
}) {
  const utils = api.useUtils();
  const isAgent = task.type === "agent";
  const isRunning = task.status === "in_progress";
  const isDone = task.status === "done";
  const hasError = Boolean(task.lastRunError);
  const due = formatDueLabel(task.dueAt);
  const scheduleLabel = formatScheduleLabel(task);
  const showCountdown = shouldShowCountdown(task) && !hasError;

  const invalidate = async () => {
    await utils.tasks.listBoard.invalidate();
    await utils.tasks.countActive.invalidate();
  };

  const updateStatus = api.tasks.updateStatus.useMutation({
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
  const runNow = useTaskRun();
  const setPaused = api.tasks.setPaused.useMutation({
    onSuccess: async (_d, vars) => {
      await invalidate();
      toast.success(vars.paused ? "Task paused" : "Task resumed");
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteTask = api.tasks.delete.useMutation({
    onSuccess: async () => {
      await invalidate();
      toast.success("Task deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex items-center gap-3 border-b border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/40">
      <select
        value={task.status}
        onChange={(event) =>
          updateStatus.mutate({
            taskId: task.id,
            status: event.target.value as TaskStatus,
          })
        }
        className={cn(
          "h-7 shrink-0 rounded-md border border-input bg-transparent px-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          STATUS_META[task.status].className,
        )}
        aria-label="Change status"
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex min-w-0 flex-1 flex-col items-start text-left"
      >
        <div className="flex w-full items-center gap-2">
          <span
            className={cn(
              "truncate font-medium",
              isDone && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
          {isRunning && isAgent ? (
            <LoaderCircle className="size-3.5 shrink-0 animate-spin text-amber-500" />
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {isAgent ? <Bot className="size-3" /> : <User className="size-3" />}
            {isAgent ? "Agent" : "Manual"}
          </span>
          {task.priority !== "normal" ? (
            <span className="capitalize">{task.priority}</span>
          ) : null}
          {isAgent && task.triggerType === "event" ? (
            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
              <Zap className="size-3" />
              {task.eventSource === "calendar" ? "Calendar" : "New email"}
            </span>
          ) : scheduleLabel ? (
            <span>{scheduleLabel}</span>
          ) : null}
          {isRunning && isAgent ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <LoaderCircle className="size-3 animate-spin" />
              Running
              <TaskRunningTimer
                startedAt={task.updatedAt}
                className="tabular-nums"
              />
            </span>
          ) : null}
          {showCountdown ? (
            <span className="inline-flex items-center gap-1 font-medium text-primary/80">
              <Clock className="size-3" />
              <TaskCountdownTimer
                nextRunAt={task.nextRunAt}
                className="tabular-nums"
              />
            </span>
          ) : null}
          {due ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                due.overdue
                  ? "text-red-600 dark:text-red-400"
                  : due.soon
                    ? "text-amber-600 dark:text-amber-400"
                    : "",
              )}
            >
              <CalendarClock className="size-3" />
              {due.label}
            </span>
          ) : null}
          {task.labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]"
            >
              {label}
            </span>
          ))}
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAgent ? (
            <DropdownMenuItem
              onClick={() => runNow.mutate({ taskId: task.id })}
              disabled={runNow.isPending || isRunning}
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
                setPaused.mutate({ taskId: task.id, paused: !task.paused })
              }
              disabled={setPaused.isPending}
            >
              {task.paused ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
              {task.paused ? "Resume" : "Pause"}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteTask.mutate({ taskId: task.id })}
            disabled={deleteTask.isPending}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TaskListView({ board }: { board: TaskBoard }) {
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [editTask, setEditTask] = useState<WorkspaceTask | null>(null);

  const tasks = flattenBoard(board);

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No tasks match this view.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card">
        {tasks.map((task) => (
          <TaskListRow
            key={task.id}
            task={task}
            onOpen={setSelectedTask}
            onEdit={setEditTask}
          />
        ))}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={selectedTask != null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />

      <CreateTaskDialog
        open={editTask != null}
        onOpenChange={(open) => {
          if (!open) setEditTask(null);
        }}
        task={editTask}
      />
    </>
  );
}
