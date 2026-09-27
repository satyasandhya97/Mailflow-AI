"use client";

import { toast } from "sonner";

import {
  moveTaskInBoard,
  placeTaskOnBoard,
} from "@/features/tasks/lib/task-board-mutations";
import { api } from "@/trpc/react";

/** Shared run-now mutation with full optimistic todo → in_progress → done lifecycle. */
export function useTaskRun(options?: { silent?: boolean }) {
  const utils = api.useUtils();

  const invalidate = async () => {
    await utils.tasks.listBoard.invalidate();
    await utils.tasks.countActive.invalidate();
  };

  return api.tasks.runNow.useMutation({
    onMutate: async ({ taskId }) => {
      await utils.tasks.listBoard.cancel();
      const previous = utils.tasks.listBoard.getData();

      if (previous) {
        utils.tasks.listBoard.setData(
          undefined,
          moveTaskInBoard(previous, taskId, "in_progress", {
            lastRunError: null,
            completedAt: null,
          }),
        );
      }

      return { previous };
    },
    onSuccess: (data) => {
      utils.tasks.listBoard.setData(undefined, (old) => {
        if (!old || !data.task) return old;
        return placeTaskOnBoard(old, data.task);
      });
      if (!options?.silent) toast.success("Task completed");
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        utils.tasks.listBoard.setData(undefined, context.previous);
      }
      if (!options?.silent) toast.error(error.message);
    },
    onSettled: () => invalidate(),
  });
}
