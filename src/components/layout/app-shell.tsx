"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/settings");

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0 overflow-hidden h-svh bg-background">
        {isSettings ? (
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-y-auto">
            {children}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        )}
      </SidebarInset>
    </>
  );
}
