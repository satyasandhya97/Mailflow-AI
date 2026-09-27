import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "default" | "brand" | "marine" | "gold" | "sage";

export type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  href?: string;
  tone?: StatTone;
};

const TONE_CLASSES: Record<StatTone, string> = {
  default: "bg-muted text-foreground",
  brand: "bg-primary/10 text-primary",
  marine: "bg-[var(--cat-marine-tint)] text-[var(--cat-marine)]",
  gold: "bg-[var(--cat-gold-tint)] text-[var(--cat-gold)]",
  sage: "bg-[var(--cat-sage-tint)] text-[var(--cat-sage)]",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone = "default",
}: StatCardProps) {
  const content = (
    <CardContent className="flex items-center gap-3.5">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </span>
        <span className="mt-1.5 truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </span>
    </CardContent>
  );

  if (!href) {
    return <Card className="ring-0 shadow-sm">{content}</Card>;
  }

  return (
    <Card className="ring-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={href}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    </Card>
  );
}
