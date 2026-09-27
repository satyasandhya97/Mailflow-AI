"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import {
  saveAuthFlow,
  savePendingEmail,
  saveSignupDraft,
} from "@/features/auth/lib/auth-storage";
import type { AuthFlow, SignupDraft } from "@/features/auth/types/auth.types";

export function useAuthNavigation() {
  const router = useRouter();

  const goToVerifyOtp = useCallback(
    (email: string, flow: AuthFlow, draft?: SignupDraft) => {
      if (draft) {
        saveSignupDraft(draft);
      }
      savePendingEmail(email);
      saveAuthFlow(flow);

      const params = new URLSearchParams({
        email,
        flow,
      });

      router.push(`/verify-otp?${params.toString()}`);
    },
    [router],
  );

  return { goToVerifyOtp };
}
