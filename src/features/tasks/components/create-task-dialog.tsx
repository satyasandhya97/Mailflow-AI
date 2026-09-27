"use client";

import { useEffect, useMemo, useState } from "react";
import { addMinutes, format } from "date-fns";
import {
  AlertCircle,
  Bot,
  CalendarClock,
  Clock,
  LoaderCircle,
  Mail,
  Sparkles,
  Tag,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TaskCountdownTimer } from "@/features/tasks/components/task-countdown-timer";
import {
  computeNextRunAt,
  DEFAULT_TASK_TIMEZONE,
} from "@/features/tasks/lib/task-schedule";
import {
  TASK_TEMPLATES,
  type TaskTemplate,
} from "@/features/tasks/lib/task-templates";
import { validateTaskDraft } from "@/features/tasks/lib/task-validation";
import type {
  TaskEventSource,
  TaskOutputDelivery,
  TaskPriority,
  TaskScheduleType,
  TaskTriggerType,
  TaskType,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: WorkspaceTask | null;
};

const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const PRIORITIES: { value: TaskPriority; label: string; hint?: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High", hint: "Important" },
  { value: "urgent", label: "Urgent", hint: "Critical" },
];

const RETRY_OPTIONS = ["0", "1", "2", "3", "5", "10"];

const selectTriggerClass =
  "h-10 w-full justify-between bg-background shadow-xs";

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("ring-border/50", className)}>
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {Icon ? <Icon className="size-4 text-primary" /> : null}
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function toDateTimeLocal(date: Date | null) {
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

function parseLabels(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(",")) {
    const trimmed = part.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen].slice(0, 12);
}

function hasFieldError(errors: string[], keywords: string[]): boolean {
  return errors.some((error) =>
    keywords.some((keyword) => error.toLowerCase().includes(keyword)),
  );
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  task,
}: CreateTaskDialogProps) {
  const utils = api.useUtils();
  const isEdit = Boolean(task);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("manual");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [labelsText, setLabelsText] = useState("");
  const [outputDelivery, setOutputDelivery] =
    useState<TaskOutputDelivery>("none");
  const [maxRetries, setMaxRetries] = useState(3);
  const [instructions, setInstructions] = useState("");
  const [triggerType, setTriggerType] = useState<TaskTriggerType>("schedule");
  const [eventSource, setEventSource] = useState<TaskEventSource>("gmail");
  const [eventFrom, setEventFrom] = useState("");
  const [eventSubject, setEventSubject] = useState("");
  const [scheduleType, setScheduleType] = useState<TaskScheduleType>("daily");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDay, setScheduleDay] = useState("1");
  const [showValidation, setShowValidation] = useState(false);

  const labels = useMemo(() => parseLabels(labelsText), [labelsText]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("manual");
    setPriority("normal");
    setDueAt("");
    setLabelsText("");
    setOutputDelivery("none");
    setMaxRetries(3);
    setInstructions("");
    setTriggerType("schedule");
    setEventSource("gmail");
    setEventFrom("");
    setEventSubject("");
    setScheduleType("daily");
    setScheduledAt("");
    setScheduleTime("09:00");
    setScheduleDay("1");
    setShowValidation(false);
  };

  const applyTemplate = (template: TaskTemplate) => {
    setTitle(template.title);
    setDescription(template.description ?? "");
    setType(template.type);
    setPriority(template.priority ?? "normal");
    setLabelsText((template.labels ?? []).join(", "));
    setInstructions(template.instructions ?? "");
    setTriggerType(template.triggerType ?? "schedule");
    setEventSource(template.eventSource ?? "gmail");
    setEventFrom(template.eventFrom ?? "");
    setEventSubject(template.eventSubject ?? "");
    setScheduleType(template.scheduleType ?? "daily");
    setScheduleTime(template.scheduleTime ?? "09:00");
    setScheduleDay(String(template.scheduleDay ?? 1));
    setOutputDelivery(template.outputDelivery ?? "none");
  };

  const setRunInMinutes = (minutes: number) => {
    setScheduleType("once");
    setTriggerType("schedule");
    setType("agent");
    setScheduledAt(format(addMinutes(new Date(), minutes), "yyyy-MM-dd'T'HH:mm"));
  };

  useEffect(() => {
    if (!open) return;

    setShowValidation(false);

    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setType(task.type);
      setPriority(task.priority);
      setDueAt(toDateTimeLocal(task.dueAt));
      setLabelsText(task.labels.join(", "));
      setOutputDelivery(task.outputDelivery);
      setMaxRetries(task.maxRetries);
      setInstructions(task.instructions ?? "");
      setTriggerType(task.triggerType);
      setEventSource(task.eventSource ?? "gmail");
      setEventFrom(task.eventFilter.from ?? "");
      setEventSubject(task.eventFilter.subject ?? "");
      setScheduleType(task.scheduleType ?? "daily");
      setScheduledAt(toDateTimeLocal(task.scheduledAt));
      setScheduleTime(task.scheduleTime ?? "09:00");
      setScheduleDay(String(task.scheduleDay ?? 1));
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const handleTypeChange = (nextType: TaskType) => {
    if (
      nextType === "agent" &&
      type === "manual" &&
      !isEdit &&
      !scheduledAt &&
      triggerType === "schedule"
    ) {
      setScheduleType("once");
      setScheduledAt(format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:mm"));
    }
    setType(nextType);
  };

  const createMutation = api.tasks.create.useMutation({
    onSuccess: async () => {
      await utils.tasks.listBoard.invalidate();
      await utils.tasks.countActive.invalidate();
      await utils.tasks.listLabels.invalidate();
      toast.success("Task created");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = api.tasks.update.useMutation({
    onSuccess: async () => {
      await utils.tasks.listBoard.invalidate();
      await utils.tasks.countActive.invalidate();
      await utils.tasks.listLabels.invalidate();
      toast.success("Task updated");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const generateDraftMutation = api.tasks.generateDraft.useMutation({
    onSuccess: (draft) => {
      setTitle(draft.title);
      setDescription(draft.description ?? "");
      setType(draft.type);
      setPriority(draft.priority ?? "normal");
      setLabelsText((draft.labels ?? []).join(", "));
      if (draft.type === "agent") {
        setInstructions(draft.instructions ?? "");
        setScheduleType(draft.scheduleType ?? "daily");
        setScheduleTime(draft.scheduleTime ?? "09:00");
        setScheduleDay(String(draft.scheduleDay ?? 1));
        if (draft.scheduledAt) {
          setScheduledAt(
            format(new Date(draft.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
          );
        }
      }
      toast.success("Details generated — review and save");
    },
    onError: (error) => toast.error(error.message),
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    generateDraftMutation.isPending;
  const isEvent = type === "agent" && triggerType === "event";

  const validation = useMemo(
    () =>
      validateTaskDraft({
        title,
        type,
        description,
        instructions,
        triggerType,
        scheduleType: type === "agent" && !isEvent ? scheduleType : null,
      }),
    [title, type, description, instructions, triggerType, isEvent, scheduleType],
  );

  const titleInvalid = showValidation && hasFieldError(validation.errors, ["title"]);
  const instructionsInvalid =
    showValidation && hasFieldError(validation.errors, ["instruction", "step"]);

  const previewNextRun = useMemo(() => {
    if (type !== "agent" || triggerType !== "schedule") return null;
    if (scheduleType === "once" && !scheduledAt) return null;

    return computeNextRunAt({
      scheduleType,
      scheduledAt:
        scheduleType === "once" && scheduledAt
          ? new Date(scheduledAt)
          : null,
      scheduleTime:
        scheduleType === "daily" || scheduleType === "weekly"
          ? scheduleTime
          : null,
      scheduleDay:
        scheduleType === "weekly" ? Number(scheduleDay) : null,
      timezone: DEFAULT_TASK_TIMEZONE,
    });
  }, [
    type,
    triggerType,
    scheduleType,
    scheduledAt,
    scheduleTime,
    scheduleDay,
  ]);

  const canSubmit = useMemo(() => {
    if (!validation.valid) return false;
    if (
      type === "agent" &&
      triggerType === "schedule" &&
      scheduleType === "once" &&
      !scheduledAt
    )
      return false;
    return true;
  }, [validation.valid, type, triggerType, scheduleType, scheduledAt]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowValidation(true);
    if (!canSubmit) {
      if (validation.errors.length) toast.error(validation.errors[0]);
      return;
    }

    const eventFilter = isEvent
      ? {
          from: eventFrom.trim() || undefined,
          subject: eventSubject.trim() || undefined,
        }
      : undefined;

    const schedulePayload =
      type === "agent" && triggerType === "schedule"
        ? {
            scheduleType,
            scheduledAt:
              scheduleType === "once" && scheduledAt
                ? new Date(scheduledAt)
                : undefined,
            scheduleTime:
              scheduleType === "daily" || scheduleType === "weekly"
                ? scheduleTime
                : undefined,
            scheduleDay:
              scheduleType === "weekly" ? Number(scheduleDay) : undefined,
          }
        : {};

    const commonAgent =
      type === "agent"
        ? {
            instructions,
            outputDelivery,
            triggerType,
            eventSource: isEvent ? eventSource : undefined,
            eventFilter,
            maxRetries,
          }
        : {};

    if (isEdit && task) {
      updateMutation.mutate({
        taskId: task.id,
        title,
        description: description || null,
        priority,
        dueAt: dueAt ? new Date(dueAt) : null,
        labels,
        ...commonAgent,
        ...schedulePayload,
        timezone: DEFAULT_TASK_TIMEZONE,
      });
      return;
    }

    createMutation.mutate({
      title,
      description: description || undefined,
      type,
      priority,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      labels,
      ...commonAgent,
      ...schedulePayload,
      timezone: DEFAULT_TASK_TIMEZONE,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isEdit) resetForm();
      }}
    >
      <DialogContent className="flex! max-h-[min(92vh,780px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-3 border-b border-border/60 px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                type === "agent"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {type === "agent" ? (
                <Bot className="size-5" />
              ) : (
                <User className="size-5" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg">
                {isEdit ? "Edit task" : "Create task"}
              </DialogTitle>
              <DialogDescription>
                {type === "agent"
                  ? "Agent tasks run automatically on a schedule or when an event fires."
                  : "Manual tasks stay on your board until you complete them."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <form
            id="create-task-form"
            className="space-y-4 px-6 py-5"
            onSubmit={handleSubmit}
          >
            {showValidation && !validation.valid ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Fix a few fields</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
                    {validation.errors.slice(0, 3).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            {!isEdit ? (
              <FormSection
                title="Quick start"
                description="Pick a template to pre-fill the form."
              >
                <div className="flex flex-wrap gap-2">
                  {TASK_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full px-3 text-xs font-normal"
                      onClick={() => applyTemplate(template)}
                    >
                      <span aria-hidden className="mr-1.5">
                        {template.emoji}
                      </span>
                      {template.label}
                    </Button>
                  ))}
                </div>
              </FormSection>
            ) : null}

            <FormSection
              title="Basics"
              description="What this task is called and what it should do."
            >
              <Field data-invalid={titleInvalid}>
                <FieldLabel htmlFor="task-title">Title</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="task-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Morning inbox summary"
                    aria-invalid={titleInvalid}
                    className="h-10 flex-1"
                  />
                  {!isEdit ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 shrink-0"
                      disabled={
                        generateDraftMutation.isPending || !title.trim()
                      }
                      onClick={() =>
                        generateDraftMutation.mutate({ hint: title.trim() })
                      }
                    >
                      {generateDraftMutation.isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      <span className="hidden sm:inline">Generate</span>
                    </Button>
                  ) : null}
                </div>
                {titleInvalid ? (
                  <FieldError>
                    {validation.errors.find((e) =>
                      e.toLowerCase().includes("title"),
                    )}
                  </FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="task-description">Description</FieldLabel>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What should this task accomplish?"
                  rows={2}
                  className="resize-none"
                />
                <FieldDescription>
                  Optional context for you or the agent.
                </FieldDescription>
              </Field>
            </FormSection>

            <FormSection
              title="Properties"
              description={
                type === "agent"
                  ? "Priority and labels. Run time is set in Agent automation below."
                  : "Priority, due date, and labels."
              }
              icon={Tag}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Task type</FieldLabel>
                  <Tabs value={type} onValueChange={(value) => handleTypeChange(value as TaskType)}>
                    <TabsList className="grid h-10 w-full grid-cols-2">
                      <TabsTrigger
                        value="manual"
                        disabled={isEdit}
                        className="gap-1.5 text-xs"
                      >
                        <User className="size-3.5" />
                        Manual
                      </TabsTrigger>
                      <TabsTrigger
                        value="agent"
                        disabled={isEdit}
                        className="gap-1.5 text-xs"
                      >
                        <Bot className="size-3.5" />
                        Agent
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Field>

                <Field>
                  <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as TaskPriority)
                    }
                  >
                    <SelectTrigger
                      id="task-priority"
                      className={selectTriggerClass}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            {item.label}
                            {item.hint ? (
                              <span className="text-xs text-muted-foreground">
                                · {item.hint}
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div
                className={cn(
                  "grid gap-4",
                  type === "manual" ? "sm:grid-cols-2" : "grid-cols-1",
                )}
              >
                {type === "manual" ? (
                  <Field>
                    <FieldLabel htmlFor="task-due">Due date</FieldLabel>
                    <div className="relative">
                      <CalendarClock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="task-due"
                        type="datetime-local"
                        value={dueAt}
                        onChange={(event) => setDueAt(event.target.value)}
                        className="h-10 pl-8"
                      />
                    </div>
                    <FieldDescription>Optional reminder deadline.</FieldDescription>
                  </Field>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="task-labels">Labels</FieldLabel>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="task-labels"
                      value={labelsText}
                      onChange={(event) => setLabelsText(event.target.value)}
                      placeholder="email, report"
                      className="h-10 pl-8"
                    />
                  </div>
                </Field>
              </div>

              {labels.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() =>
                          setLabelsText(
                            labels.filter((l) => l !== label).join(", "),
                          )
                        }
                        className="rounded-full p-0.5 hover:bg-muted"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </FormSection>

            {type === "agent" ? (
              <FormSection
                title="Agent automation"
                description="Instructions, trigger, and delivery settings."
                icon={Bot}
              >
                <Field data-invalid={instructionsInvalid}>
                  <FieldLabel htmlFor="task-instructions">
                    Agent instructions
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Textarea
                    id="task-instructions"
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Summarize unread emails from the last 24 hours and list action items."
                    rows={4}
                    aria-invalid={instructionsInvalid}
                    className="resize-none"
                  />
                  {instructionsInvalid ? (
                    <FieldError>
                      {validation.errors.find((e) =>
                        e.toLowerCase().includes("instruction"),
                      ) ?? "Add clear step-by-step instructions for the agent."}
                    </FieldError>
                  ) : (
                    <FieldDescription>
                      Step-by-step directions — which tools to use and what to
                      deliver.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Trigger</FieldLabel>
                  <Tabs
                    value={triggerType}
                    onValueChange={(value) =>
                      setTriggerType(value as TaskTriggerType)
                    }
                  >
                    <TabsList className="grid h-10 w-full grid-cols-2">
                      <TabsTrigger value="schedule" className="gap-1.5 text-xs">
                        <Clock className="size-3.5" />
                        On schedule
                      </TabsTrigger>
                      <TabsTrigger value="event" className="gap-1.5 text-xs">
                        <Zap className="size-3.5" />
                        On event
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Field>

                {triggerType === "schedule" ? (
                  <div className="space-y-4 rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="task-schedule-type">
                          Schedule
                        </FieldLabel>
                        <Select
                          value={scheduleType}
                          onValueChange={(value) =>
                            setScheduleType(value as TaskScheduleType)
                          }
                        >
                          <SelectTrigger
                            id="task-schedule-type"
                            className={selectTriggerClass}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      {scheduleType === "once" ? (
                        <Field>
                          <FieldLabel htmlFor="task-scheduled-at">
                            Run at
                          </FieldLabel>
                          <div className="relative">
                            <CalendarClock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="task-scheduled-at"
                              type="datetime-local"
                              value={scheduledAt}
                              onChange={(event) =>
                                setScheduledAt(event.target.value)
                              }
                              className="h-10 pl-8"
                            />
                          </div>
                          <FieldDescription>
                            The agent runs automatically at this time.
                          </FieldDescription>
                        </Field>
                      ) : (
                        <Field>
                          <FieldLabel htmlFor="task-schedule-time">
                            Time
                          </FieldLabel>
                          <Input
                            id="task-schedule-time"
                            type="time"
                            value={scheduleTime}
                            onChange={(event) =>
                              setScheduleTime(event.target.value)
                            }
                            className="h-10"
                          />
                        </Field>
                      )}
                    </div>

                    {scheduleType === "once" ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="w-full text-xs font-medium text-muted-foreground">
                          Quick schedule
                        </span>
                        {[
                          { label: "In 5 min", minutes: 5 },
                          { label: "In 15 min", minutes: 15 },
                          { label: "In 1 hour", minutes: 60 },
                        ].map((preset) => (
                          <Button
                            key={preset.minutes}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setRunInMinutes(preset.minutes)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    ) : null}

                    {scheduleType === "weekly" ? (
                      <Field>
                        <FieldLabel htmlFor="task-schedule-day">
                          Weekday
                        </FieldLabel>
                        <Select
                          value={scheduleDay}
                          onValueChange={(value) => {
                            if (value) setScheduleDay(value);
                          }}
                        >
                          <SelectTrigger
                            id="task-schedule-day"
                            className={selectTriggerClass}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEEKDAYS.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    ) : null}

                    {previewNextRun ? (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-background px-3 py-2.5 text-sm shadow-xs">
                        <Clock className="size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">
                          First run{" "}
                          <span className="font-medium text-foreground">
                            {format(previewNextRun, "MMM d, h:mm a")}
                          </span>
                          {" · "}
                          <TaskCountdownTimer
                            nextRunAt={previewNextRun}
                            className="font-medium text-primary tabular-nums"
                          />
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="task-event-source">
                          Event source
                        </FieldLabel>
                        <Select
                          value={eventSource}
                          onValueChange={(value) =>
                            setEventSource(value as TaskEventSource)
                          }
                        >
                          <SelectTrigger
                            id="task-event-source"
                            className={selectTriggerClass}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gmail">
                              New email (Gmail)
                            </SelectItem>
                            <SelectItem value="calendar">
                              Calendar change
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      {eventSource === "gmail" ? (
                        <Field>
                          <FieldLabel htmlFor="task-event-from">
                            From contains
                          </FieldLabel>
                          <Input
                            id="task-event-from"
                            value={eventFrom}
                            onChange={(event) =>
                              setEventFrom(event.target.value)
                            }
                            placeholder="boss@company.com"
                            className="h-10"
                          />
                        </Field>
                      ) : null}
                    </div>

                    <Field>
                      <FieldLabel htmlFor="task-event-subject">
                        Subject contains
                      </FieldLabel>
                      <Input
                        id="task-event-subject"
                        value={eventSubject}
                        onChange={(event) =>
                          setEventSubject(event.target.value)
                        }
                        placeholder="invoice, urgent…"
                        className="h-10"
                      />
                      <FieldDescription>
                        Leave filters blank to run on every {eventSource}{" "}
                        event.
                      </FieldDescription>
                    </Field>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="task-output-delivery">
                      When finished
                    </FieldLabel>
                    <Select
                      value={outputDelivery}
                      onValueChange={(value) =>
                        setOutputDelivery(value as TaskOutputDelivery)
                      }
                    >
                      <SelectTrigger
                        id="task-output-delivery"
                        className={selectTriggerClass}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Save result on task
                        </SelectItem>
                        <SelectItem value="email">
                          <span className="flex items-center gap-2">
                            <Mail className="size-3.5" />
                            Email me the result
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="task-max-retries">
                      Max retries
                    </FieldLabel>
                    <Select
                      value={String(maxRetries)}
                      onValueChange={(value) =>
                        setMaxRetries(Number(value))
                      }
                    >
                      <SelectTrigger
                        id="task-max-retries"
                        className={selectTriggerClass}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETRY_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value === "0"
                              ? "No retries"
                              : `${value} ${value === "1" ? "retry" : "retries"}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FormSection>
            ) : null}
          </form>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-between">
          {showValidation && !canSubmit ? (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {validation.errors.length} field
              {validation.errors.length === 1 ? "" : "s"} need attention
            </p>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-task-form"
              disabled={isPending}
              className={cn("min-w-32", isPending && "min-w-36")}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create task"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
