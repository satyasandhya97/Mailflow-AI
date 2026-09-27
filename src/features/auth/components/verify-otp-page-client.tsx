"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import { VerifyOtpForm } from "@/features/auth/components/verify-otp-form";
import {
  getAuthFlow,
  getPendingEmail,
} from "@/features/auth/lib/auth-storage";
import type { AuthFlow } from "@/features/auth/types/auth.types";

function parseFlow(value: string | null): AuthFlow | null {
  return value === "signup" || value === "login" ? value : null;
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromQuery = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const flowFromQuery = parseFlow(searchParams.get("flow"));

  const email =
    emailFromQuery !== "" ? emailFromQuery : (getPendingEmail() ?? "");
  const flow = flowFromQuery ?? getAuthFlow();

  useEffect(() => {
    if (!email || !flow) {
      router.replace("/login");
    }
  }, [email, flow, router]);

  if (!email || !flow) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return <VerifyOtpForm email={email} flow={flow} />;
}

export function VerifyOtpPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
