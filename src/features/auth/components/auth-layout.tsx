import Link from "next/link";

import { cn } from "@/lib/utils";

export function AuthLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10",
        className,
      )}
    >
      <Link
        href="/"
        className="mb-8 text-sm font-semibold tracking-tight text-foreground"
      >
        Mailflow AI
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
