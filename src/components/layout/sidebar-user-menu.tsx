"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { logoutAction } from "@/features/auth/actions/logout.action";
import {
  getUserInitials,
  maskEmailForDisplay,
} from "@/features/auth/lib/user-display";
import { useMounted } from "@/hooks/use-mounted";
import { api } from "@/trpc/react";

export function SidebarUserMenu() {
  const router = useRouter();
  const mounted = useMounted();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: user, isLoading, isError } = api.auth.me.useQuery(undefined, {
    retry: false,
  });

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutAction();
      window.location.assign("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const initials = user ? getUserInitials(user.fullName) : "U";
  const displayName = user?.fullName ?? "Account";
  const displayEmail = user ? maskEmailForDisplay(user.email) : "Signed in";

  const trigger = (
    <SidebarMenuButton
      size="lg"
      className="rounded-xl border border-sidebar-border bg-background data-open:bg-sidebar-accent"
    >
      {isLoading ? (
        <Skeleton className="size-8 rounded-lg" />
      ) : (
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-32" />
          </>
        ) : (
          <>
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {isError ? "Unable to load profile" : displayEmail}
            </span>
          </>
        )}
      </div>

      <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
    </SidebarMenuButton>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {!mounted ? (
          trigger
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger render={trigger} />

            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="min-w-56 rounded-lg"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email ?? ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                  <User />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
              >
                <LogOut />
                {isLoggingOut ? "Logging out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
