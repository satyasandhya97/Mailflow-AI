import type { AgentConversation } from "@/features/agent/types/agent.types";

export type ChatHistoryGroup = {
  id: string;
  label: string;
  conversations: AgentConversation[];
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getGroupLabel(updatedAt: number, now: Date): { id: string; label: string } {
  const todayStart = startOfDay(now);
  const updatedStart = startOfDay(new Date(updatedAt));
  const dayDiff = Math.floor((todayStart - updatedStart) / 86_400_000);

  if (dayDiff === 0) {
    return { id: "today", label: "Today" };
  }

  if (dayDiff === 1) {
    return { id: "yesterday", label: "Yesterday" };
  }

  if (dayDiff <= 7) {
    return { id: "previous-7-days", label: "Previous 7 Days" };
  }

  if (dayDiff <= 30) {
    return { id: "previous-30-days", label: "Previous 30 Days" };
  }

  const monthDate = new Date(updatedAt);
  const monthId = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: monthDate.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(monthDate);

  return { id: monthId, label: monthLabel };
}

const GROUP_ORDER = [
  "today",
  "yesterday",
  "previous-7-days",
  "previous-30-days",
] as const;

export function groupConversationsByDate(
  conversations: AgentConversation[],
  now = new Date(),
): ChatHistoryGroup[] {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const groupMap = new Map<string, ChatHistoryGroup>();

  for (const conversation of sorted) {
    const { id, label } = getGroupLabel(conversation.updatedAt, now);
    const existing = groupMap.get(id);

    if (existing) {
      existing.conversations.push(conversation);
      continue;
    }

    groupMap.set(id, {
      id,
      label,
      conversations: [conversation],
    });
  }

  const monthGroups = [...groupMap.values()].filter(
    (group) => !GROUP_ORDER.includes(group.id as (typeof GROUP_ORDER)[number]),
  );

  monthGroups.sort((a, b) => {
    const aTime = a.conversations[0]?.updatedAt ?? 0;
    const bTime = b.conversations[0]?.updatedAt ?? 0;
    return bTime - aTime;
  });

  const ordered: ChatHistoryGroup[] = [];

  for (const groupId of GROUP_ORDER) {
    const group = groupMap.get(groupId);
    if (group && group.conversations.length > 0) {
      ordered.push(group);
    }
  }

  return [...ordered, ...monthGroups];
}
