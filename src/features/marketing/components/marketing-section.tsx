import { cn } from "@/lib/utils";

type MarketingSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "muted" | "brand";
};

const sizeClasses = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-20",
  lg: "py-20 sm:py-28",
} as const;

const variantClasses = {
  default: "bg-background",
  muted: "bg-muted/40",
  brand: "bg-[color-mix(in_srgb,var(--teal-100)_55%,var(--background))]",
} as const;

export function MarketingSection({
  children,
  className,
  id,
  size = "md",
  variant = "default",
}: MarketingSectionProps) {
  return (
    <section
      id={id}
      className={cn(sizeClasses[size], variantClasses[variant], className)}
    >
      {children}
    </section>
  );
}
