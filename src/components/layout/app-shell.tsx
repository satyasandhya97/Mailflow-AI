"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarInset } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleedPage =
    pathname.startsWith("/plugins") ||
    pathname.startsWith("/gmail") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/tasks");

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0 overflow-hidden h-svh  ">
        {!isFullBleedPage && <Topbar />}
        {isFullBleedPage ? (
          <div className="flex min-h-0 flex-1 flex-col ">{children}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 ">
            {children}
          </div>
        )}
      </SidebarInset>
    </>
  );
}
