"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TaskCard } from "@/features/tasks/components/task-card";
import { TaskColumn } from "@/features/tasks/components/task-column";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import {
  TASK_COLUMNS,
  type TaskBoard,
  type TaskStatus,
  type WorkspaceTask,
} from "@/features/tasks/types/task.types";
import { api } from "@/trpc/react";

type TaskBoardViewProps = {
  board: TaskBoard;
};

function findTask(board: TaskBoard, taskId: string): WorkspaceTask | null {
  for (const column of TASK_COLUMNS) {
    const match = board[column.id].find((task) => task.id === taskId);
    if (match) return match;
  }
  return null;
}

export function TaskBoardView({ board }: TaskBoardViewProps) {
  const utils = api.useUtils();
  const [activeTask, setActiveTask] = useState<WorkspaceTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const updateStatus = api.tasks.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.tasks.listBoard.invalidate();
      await utils.tasks.countActive.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TASK_COLUMNS.map((column) => [column.id, board[column.id].length]),
      ) as Record<TaskStatus, number>,
    [board],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(board, String(event.active.id));
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const taskId = String(event.active.id);
    const overId = event.over?.id;

    if (!overId) return;

    const task = findTask(board, taskId);
    if (!task) return;

    const nextStatus = String(overId) as TaskStatus;
    if (!TASK_COLUMNS.some((column) => column.id === nextStatus)) return;
    if (task.status === nextStatus) return;

    updateStatus.mutate({
      taskId,
      status: nextStatus,
      position: board[nextStatus].length,
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TASK_COLUMNS.map((column) => (
            <TaskColumn
              key={column.id}
              status={column.id}
              title={column.title}
              count={counts[column.id]}
              isEmpty={board[column.id].length === 0}
            >
              {board[column.id].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={setSelectedTask}
                />
              ))}
            </TaskColumn>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[280px] rotate-2 opacity-95">
              <TaskCard task={activeTask} onOpen={() => undefined} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet
        task={selectedTask}
        open={selectedTask != null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </>
  );
}
