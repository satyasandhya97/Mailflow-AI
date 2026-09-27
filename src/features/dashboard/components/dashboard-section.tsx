import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type DashboardSectionProps = {
  title: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  isLoading?: boolean;
  skeleton?: React.ReactNode;
  isEmpty?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function DashboardSection({
  title,
  icon: Icon,
  action,
  isLoading = false,
  skeleton,
  isEmpty = false,
  emptyIcon: EmptyIcon,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  children,
}: DashboardSectionProps) {
  return (
    <Card className="ring-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
          {title}
        </CardTitle>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {action.label}
            <ArrowRight className="size-3" />
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          skeleton
        ) : isEmpty ? (
          <Empty className="border-0 py-8">
            <EmptyHeader>
              {EmptyIcon ? (
                <EmptyMedia variant="icon">
                  <EmptyIcon />
                </EmptyMedia>
              ) : null}
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              {emptyMessage ? (
                <EmptyDescription>{emptyMessage}</EmptyDescription>
              ) : null}
            </EmptyHeader>
          </Empty>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
