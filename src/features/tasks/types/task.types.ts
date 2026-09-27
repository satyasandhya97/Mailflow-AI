export type TaskType = "manual" | "agent";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskScheduleType = "once" | "daily" | "weekly";
export type TaskRunStatus = "running" | "success" | "failed";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskOutputDelivery = "none" | "email";
export type TaskTriggerType = "schedule" | "event";
export type TaskEventSource = "gmail" | "calendar";

export type TaskEventFilter = {
  /** Match emails whose sender contains this string. */
  from?: string;
  /** Match emails/events whose subject/title contains this string. */
  subject?: string;
};

export type WorkspaceTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  position: number;
  priority: TaskPriority;
  paused: boolean;
  outputDelivery: TaskOutputDelivery;
  dueAt: Date | null;
  labels: string[];
  attempts: number;
  maxRetries: number;
  triggerType: TaskTriggerType;
  eventSource: TaskEventSource | null;
  eventFilter: TaskEventFilter;
  instructions: string | null;
  scheduleType: TaskScheduleType | null;
  scheduledAt: Date | null;
  scheduleTime: string | null;
  scheduleDay: number | null;
  timezone: string;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  lastRunError: string | null;
  lastRunOutput: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskRun = {
  id: string;
  taskId: string;
  status: TaskRunStatus;
  output: string | null;
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

export type TaskBoard = Record<TaskStatus, WorkspaceTask[]>;

export const TASK_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];
