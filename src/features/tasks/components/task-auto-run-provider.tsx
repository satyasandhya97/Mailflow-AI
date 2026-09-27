"use client";

import { useEffect, useRef } from "react";

import { useAutoRunDueTasks } from "@/features/tasks/hooks/use-auto-run-due-tasks";
import { boardRefetchIntervalMs } from "@/features/tasks/lib/task-due";
import { api } from "@/trpc/react";

/**
 * Keeps scheduled agent tasks running app-wide (any page), not only on /tasks.
 * Client countdown triggers runNow; server runDue is a backup tick.
 */
export function TaskAutoRunProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const boardQuery = api.tasks.listBoard.useQuery(undefined, {
    refetchInterval: (q) => boardRefetchIntervalMs(q.state.data),
    refetchOnWindowFocus: true,
  });

  useAutoRunDueTasks(boardQuery.data);

  const runDue = api.tasks.runDue.useMutation({
    onSuccess: () => {
      void boardQuery.refetch();
    },
  });
  const runDueMutate = useRef(runDue.mutate);
  runDueMutate.current = runDue.mutate;

  useEffect(() => {
    const tick = () => runDueMutate.current();
    const id = setInterval(tick, 5_000);
    return () => clearInterval(id);
  }, []);

  return children;
}
