"use client";

import { Badge } from "@/components/ui/badge";

const shortcuts = [
  { key: "c", label: "compose" },
  { key: "/", label: "search" },
  { key: "j", label: "next" },
  { key: "k", label: "previous" },
] as const;

export function KeyboardHint() {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
      <span>Shortcuts:</span>
      {shortcuts.map(({ key, label }) => (
        <span key={key} className="inline-flex items-center gap-1">
          <Badge variant="secondary">{key}</Badge>
          <span>{label}</span>
        </span>
      ))}
    </p>
  );
}
