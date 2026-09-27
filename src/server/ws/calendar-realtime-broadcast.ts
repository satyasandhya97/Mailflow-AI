import { getGmailRealtimeHub } from "@/server/ws/gmail-realtime-hub";

export type CalendarRealtimeEvent = {
  type: "calendar.events.updated";
  at: string;
};

const globalForCalendarWs = globalThis as typeof globalThis & {
  __calendarRealtimeConnections?: Map<string, Set<(event: CalendarRealtimeEvent) => void>>;
};

function getConnections() {
  globalForCalendarWs.__calendarRealtimeConnections ??= new Map();
  return globalForCalendarWs.__calendarRealtimeConnections;
}

export async function broadcastCalendarEventsUpdated(
  userId: string,
): Promise<void> {
  const payload: CalendarRealtimeEvent = {
    type: "calendar.events.updated",
    at: new Date().toISOString(),
  };

  const listeners = getConnections().get(userId);
  if (listeners) {
    for (const listener of listeners) {
      listener(payload);
    }
  }

  try {
    getGmailRealtimeHub().broadcastInboxUpdated(userId);
  } catch {
    // Optional in-process hub.
  }
}

export function subscribeCalendarEventsUpdated(
  userId: string,
  listener: (event: CalendarRealtimeEvent) => void,
): () => void {
  const connections = getConnections();
  const existing = connections.get(userId) ?? new Set();
  existing.add(listener);
  connections.set(userId, existing);

  return () => {
    const current = connections.get(userId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      connections.delete(userId);
    }
  };
}
