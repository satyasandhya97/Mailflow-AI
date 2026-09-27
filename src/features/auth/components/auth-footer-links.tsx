import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthFooterLinksProps = {
  prompt: string;
  linkLabel: string;
  href: string;
  className?: string;
};

export function AuthFooterLinks({
  prompt,
  linkLabel,
  href,
  className,
}: AuthFooterLinksProps) {
  return (
    <p className={cn("text-center text-sm text-muted-foreground", className)}>
      {prompt}{" "}
      <Link
        href={href}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
