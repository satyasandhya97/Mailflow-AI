import { api } from "@/trpc/react";

export function useCalendarActions() {
  const utils = api.useUtils();

  const updateEvent = api.calendar.updateEvent.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.calendar.searchEvents.invalidate(),
        utils.calendar.getEvent.invalidate({ id: variables.id }),
      ]);
    },
  });

  const deleteEvent = api.calendar.deleteEvent.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
    },
  });

  return {
    updateEvent,
    deleteEvent,
    isPending: updateEvent.isPending || deleteEvent.isPending,
  };
}
