import { cn } from "@/lib/utils";

type MarketingContainerProps = {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  asCard?: boolean;
};

const sizeClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
} as const;

export function MarketingContainer({
  children,
  className,
  size = "lg",
  asCard = false,
}: MarketingContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className,
      )}
    >
      {asCard ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
