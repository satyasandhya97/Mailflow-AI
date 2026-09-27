import type {
  TaskEventSource,
  TaskOutputDelivery,
  TaskPriority,
  TaskScheduleType,
  TaskTriggerType,
  TaskType,
} from "@/features/tasks/types/task.types";

export type TaskTemplate = {
  id: string;
  label: string;
  emoji: string;
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  labels?: string[];
  instructions?: string;
  triggerType?: TaskTriggerType;
  eventSource?: TaskEventSource;
  eventFrom?: string;
  eventSubject?: string;
  scheduleType?: TaskScheduleType;
  scheduleTime?: string;
  scheduleDay?: number;
  outputDelivery?: TaskOutputDelivery;
};

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "inbox-summary",
    label: "Daily inbox summary",
    emoji: "📥",
    title: "Morning inbox summary",
    type: "agent",
    labels: ["email"],
    instructions:
      "Summarize my unread emails from the last 24 hours. Group by sender and list any action items or deadlines I should know about.",
    triggerType: "schedule",
    scheduleType: "daily",
    scheduleTime: "09:00",
    outputDelivery: "email",
  },
  {
    id: "calendar-brief",
    label: "End-of-day brief",
    emoji: "📅",
    title: "Tomorrow's calendar brief",
    type: "agent",
    labels: ["calendar"],
    instructions:
      "List my meetings for tomorrow with times and attendees, and flag anything that needs preparation.",
    triggerType: "schedule",
    scheduleType: "daily",
    scheduleTime: "18:00",
    outputDelivery: "email",
  },
  {
    id: "weekly-report",
    label: "Weekly report",
    emoji: "📊",
    title: "Weekly status report",
    type: "agent",
    priority: "high",
    labels: ["report"],
    instructions:
      "Compile a short weekly summary of important emails and calendar events from the past 7 days.",
    triggerType: "schedule",
    scheduleType: "weekly",
    scheduleDay: 1,
    scheduleTime: "09:00",
    outputDelivery: "email",
  },
  {
    id: "important-email",
    label: "Watch for VIP email",
    emoji: "🔔",
    title: "Alert on email from boss",
    type: "agent",
    priority: "high",
    labels: ["email", "alert"],
    instructions:
      "When a matching email arrives, summarize it and draft a suggested reply I can review.",
    triggerType: "event",
    eventSource: "gmail",
    eventSubject: "",
    eventFrom: "",
    outputDelivery: "email",
  },
  {
    id: "simple-todo",
    label: "Simple to-do",
    emoji: "✅",
    title: "",
    type: "manual",
  },
];
