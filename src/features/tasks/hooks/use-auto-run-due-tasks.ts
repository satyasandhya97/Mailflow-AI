"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  autoRunKey,
  collectDueTasks,
} from "@/features/tasks/lib/task-due";
import { useTaskRun } from "@/features/tasks/hooks/use-task-run";
import type { TaskBoard } from "@/features/tasks/types/task.types";

/**
 * When a scheduled agent task's countdown hits zero, run it automatically.
 * Uses the same mutation as manual "Run now" for consistent optimistic UI.
 */
export function useAutoRunDueTasks(board: TaskBoard | undefined) {
  const runMutation = useTaskRun({ silent: true });
  const triggeredRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);
  const drainingRef = useRef(false);
  const boardRef = useRef(board);
  boardRef.current = board;

  const drainQueue = useCallback(() => {
    if (drainingRef.current || runMutation.isPending) return;

    const nextId = queueRef.current.shift();
    if (!nextId) return;

    drainingRef.current = true;
    runMutation.mutate(
      { taskId: nextId },
      {
        onSettled: () => {
          drainingRef.current = false;
          drainQueue();
        },
      },
    );
  }, [runMutation]);

  const scanAndQueue = useCallback(() => {
    const currentBoard = boardRef.current;
    if (!currentBoard) return;

    const due = collectDueTasks(currentBoard);
    const inProgress = new Set(currentBoard.in_progress.map((t) => t.id));
    let queued = false;

    for (const task of due) {
      if (inProgress.has(task.id)) continue;

      const key = autoRunKey(task);
      if (triggeredRef.current.has(key)) continue;

      triggeredRef.current.add(key);
      if (!queueRef.current.includes(task.id)) {
        queueRef.current.push(task.id);
        queued = true;
      }
    }

    if (queued) drainQueue();
  }, [drainQueue]);

  useEffect(() => {
    scanAndQueue();
  }, [board, scanAndQueue]);

  useEffect(() => {
    const id = setInterval(scanAndQueue, 1000);
    return () => clearInterval(id);
  }, [scanAndQueue]);
}
