"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

import { TASK_COLUMN_META } from "@/features/tasks/lib/task-column-meta";
import type { TaskStatus } from "@/features/tasks/types/task.types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type TaskColumnProps = {
  status: TaskStatus;
  title: string;
  count: number;
  children: ReactNode;
  isEmpty?: boolean;
};

export function TaskColumn({
  status,
  title,
  count,
  children,
  isEmpty,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = TASK_COLUMN_META[status];
  const Icon = meta.icon;

  return (
    <section
      className={cn(
        "relative flex min-w-[300px] flex-1 flex-col rounded-2xl border border-border/60 bg-muted/20",
        "before:absolute before:inset-x-0 before:top-0 before:h-1 before:content-['']",
        meta.accentClass,
      )}
    >
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "size-4",
              meta.dotClass,
              status === "in_progress" && "animate-spin",
            )}
          />
          <h2 className={cn("text-sm font-semibold", meta.headerClass)}>
            {title}
          </h2>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
            {count}
          </span>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-col gap-3 px-3 pb-3 transition-colors",
          isOver && "bg-primary/5",
        )}
      >
        {isEmpty ? (
          <Empty className="border border-dashed border-border/70 bg-background/50 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon className={meta.dotClass} />
              </EmptyMedia>
              <EmptyTitle className="text-sm">No tasks here</EmptyTitle>
              <EmptyDescription>Drag a task into {title}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {children}
      </div>
    </section>
  );
}
