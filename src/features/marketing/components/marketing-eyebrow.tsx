import { cn } from "@/lib/utils";

export function MarketingEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.18em] text-primary",
        className,
      )}
    >
      {children}
    </p>
  );
}
