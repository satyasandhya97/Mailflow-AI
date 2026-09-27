"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  ListTodo,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { TaskBoardView } from "@/features/tasks/components/task-board";
import { TaskCountdownTimer } from "@/features/tasks/components/task-countdown-timer";
import { TaskListView } from "@/features/tasks/components/task-list-view";
import { TaskQuickAdd } from "@/features/tasks/components/task-quick-add";
import {
  computeTaskStats,
  filterBoard,
  type TaskFilter,
} from "@/features/tasks/lib/task-board";
import {
  boardRefetchIntervalMs,
  collectDueTasks,
  hasDueScheduledTasks,
} from "@/features/tasks/lib/task-due";
import type { TaskBoard } from "@/features/tasks/types/task.types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const FILTERS: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "manual", label: "Manual" },
  { id: "agent", label: "Agent" },
  { id: "today", label: "Due today" },
  { id: "overdue", label: "Overdue" },
  { id: "failed", label: "Failed" },
];

type ViewMode = "board" | "list";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  tone?: "amber" | "emerald" | "red" | "default";
}) {
  return (
    <Card size="sm" className="min-w-[120px] flex-1 ring-border/60">
      <CardContent className="flex items-center gap-3 py-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted",
            tone === "amber" && "bg-amber-500/10 text-amber-600",
            tone === "emerald" && "bg-emerald-500/10 text-emerald-600",
            tone === "red" && "bg-red-500/10 text-red-600",
            (!tone || tone === "default") && "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums leading-none">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function nextScheduledTask(board: TaskBoard) {
  const now = Date.now();
  let nearest: (typeof board.todo)[number] | null = null;
  let nearestMs = Infinity;

  for (const task of [...board.todo, ...board.done]) {
    if (task.type !== "agent" || task.paused || !task.nextRunAt) continue;
    if (task.triggerType === "event") continue;
    if (task.status === "in_progress") continue;

    const diff = new Date(task.nextRunAt).getTime() - now;
    if (diff <= 0 || diff >= nearestMs) continue;

    nearestMs = diff;
    nearest = task;
  }

  return nearest;
}

export function TasksPageView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("board");

  const boardQuery = api.tasks.listBoard.useQuery(undefined, {
    refetchInterval: (q) => boardRefetchIntervalMs(q.state.data),
  });

  const labelsQuery = api.tasks.listLabels.useQuery();

  const stats = useMemo(
    () => (boardQuery.data ? computeTaskStats(boardQuery.data) : null),
    [boardQuery.data],
  );

  const filteredBoard = useMemo(
    () =>
      boardQuery.data
        ? filterBoard(boardQuery.data, filter, query, label)
        : null,
    [boardQuery.data, filter, query, label],
  );

  const runningTasks = boardQuery.data?.in_progress ?? [];
  const dueNowTasks = boardQuery.data
    ? collectDueTasks(boardQuery.data)
    : [];
  const upcomingTask = boardQuery.data
    ? nextScheduledTask(boardQuery.data)
    : null;
  const hasDue = boardQuery.data
    ? hasDueScheduledTasks(boardQuery.data)
    : false;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border/60 bg-background">
        <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ListTodo className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight">
                  Task execution
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  Live board for manual work and autonomous agent runs.
                </p>
              </div>
            </div>

            <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">New task</span>
            </Button>
          </div>

          {hasDue && dueNowTasks.length > 0 && runningTasks.length === 0 ? (
            <Alert className="border-primary/30 bg-primary/5">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              <AlertDescription>
                <span className="font-medium">
                  {dueNowTasks.length} scheduled task
                  {dueNowTasks.length === 1 ? "" : "s"} due — starting automatically…
                </span>
              </AlertDescription>
            </Alert>
          ) : null}

          {runningTasks.length > 0 ? (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <LoaderCircle className="size-4 animate-spin text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                <span className="font-medium">
                  {runningTasks.length} agent task
                  {runningTasks.length === 1 ? "" : "s"} running
                </span>
                {" — "}
                {runningTasks.map((t) => t.title).join(", ")}
              </AlertDescription>
              <Progress value={null} className="mt-2 gap-0">
                <ProgressTrack className="h-1">
                  <ProgressIndicator className="w-1/3 animate-[task-progress_1.2s_ease-in-out_infinite] bg-amber-500" />
                </ProgressTrack>
              </Progress>
            </Alert>
          ) : upcomingTask && !hasDue ? (
            <Alert className="border-border/60 bg-muted/30">
              <Clock className="size-4 text-muted-foreground" />
              <AlertDescription className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  Next: {upcomingTask.title}
                </span>
                {" — "}
                <TaskCountdownTimer
                  nextRunAt={upcomingTask.nextRunAt}
                  className="tabular-nums font-medium text-primary"
                />
              </AlertDescription>
            </Alert>
          ) : null}

          <TaskQuickAdd />

          {stats ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <StatCard
                icon={ListTodo}
                label="active"
                value={stats.todo + stats.inProgress}
              />
              <StatCard
                icon={LoaderCircle}
                label="running"
                value={stats.running}
                tone="amber"
              />
              <StatCard
                icon={CheckCircle2}
                label="done today"
                value={stats.completedToday}
                tone="emerald"
              />
              {stats.overdue > 0 ? (
                <StatCard
                  icon={AlertTriangle}
                  label="overdue"
                  value={stats.overdue}
                  tone="red"
                />
              ) : null}
              <StatCard icon={Bot} label="agent tasks" value={stats.agent} />
            </div>
          ) : boardQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as TaskFilter)}
            >
              <TabsList className="h-auto flex-wrap">
                {FILTERS.map((item) => (
                  <TabsTrigger key={item.id} value={item.id} className="gap-1">
                    {item.label}
                    {item.id === "failed" && stats?.failed ? (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                        {stats.failed}
                      </Badge>
                    ) : null}
                    {item.id === "overdue" && stats?.overdue ? (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                        {stats.overdue}
                      </Badge>
                    ) : null}
                    {item.id === "today" && stats?.dueToday ? (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        {stats.dueToday}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search tasks…"
                  className="pl-8"
                />
              </div>

              <div className="flex items-center rounded-lg border border-border/60 p-0.5">
                <Button
                  type="button"
                  variant={view === "board" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7"
                  onClick={() => setView("board")}
                  aria-label="Board view"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7"
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {labelsQuery.data?.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant={label === null ? "default" : "outline"}
                size="sm"
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setLabel(null)}
              >
                All labels
              </Button>
              {labelsQuery.data.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={label === item ? "default" : "outline"}
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setLabel(label === item ? null : item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {boardQuery.isLoading ? (
          <div className="grid h-full gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-full ring-border/60">
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : boardQuery.error ? (
          <Card className="flex h-full items-center justify-center ring-destructive/30">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">
                Could not load tasks
              </CardTitle>
              <CardDescription>Check your connection and retry.</CardDescription>
            </CardHeader>
          </Card>
        ) : filteredBoard ? (
          view === "board" ? (
            <TaskBoardView board={filteredBoard} />
          ) : (
            <TaskListView board={filteredBoard} />
          )
        ) : null}
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
