import { CheckCircle2, Circle, LoaderCircle, type LucideIcon } from "lucide-react";

import type { TaskStatus } from "@/features/tasks/types/task.types";

export type TaskColumnMeta = {
  icon: LucideIcon;
  dotClass: string;
  accentClass: string;
  headerClass: string;
};

export const TASK_COLUMN_META: Record<TaskStatus, TaskColumnMeta> = {
  todo: {
    icon: Circle,
    dotClass: "text-muted-foreground",
    accentClass: "before:bg-muted-foreground/40",
    headerClass: "text-muted-foreground",
  },
  in_progress: {
    icon: LoaderCircle,
    dotClass: "text-amber-500",
    accentClass: "before:bg-amber-500",
    headerClass: "text-amber-600 dark:text-amber-400",
  },
  done: {
    icon: CheckCircle2,
    dotClass: "text-emerald-500",
    accentClass: "before:bg-emerald-500",
    headerClass: "text-emerald-600 dark:text-emerald-400",
  },
};
