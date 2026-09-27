"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserInitials } from "@/features/auth/lib/user-display";
import { api } from "@/trpc/react";

export default function ProfilePage() {
  const { data: user, isLoading } = api.auth.me.useQuery();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details for Mailflow AI.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <Avatar size="lg">
          <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">{user.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Full name</dt>
          <dd className="text-sm font-medium">{user.fullName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="text-sm font-medium">{user.email}</dd>
        </div>
      </dl>
    </div>
  );
}
