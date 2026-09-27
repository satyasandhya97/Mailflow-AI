"use client";

import { useCallback, useState } from "react";
import { TRPCClientError } from "@trpc/client";

import { savePreviewOtp } from "@/features/auth/lib/auth-storage";
import type { AuthFlow } from "@/features/auth/types/auth.types";
import { api } from "@/trpc/react";

function getErrorMessage(error: unknown) {
  if (error instanceof TRPCClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function useAuthApi() {
  const sendOtpMutation = api.auth.sendOtp.useMutation();
  const resendOtpMutation = api.auth.resendOtp.useMutation();
  const [action, setAction] = useState<"send" | "resend" | null>(null);

  const sendOtp = useCallback(
    async (input: { email: string; flow: AuthFlow; fullName?: string }) => {
      setAction("send");
      try {
        const result = await sendOtpMutation.mutateAsync(input);
        if (result?.previewCode) savePreviewOtp(result.previewCode);
        return { success: true as const };
      } catch (error) {
        return {
          success: false as const,
          message: getErrorMessage(error),
        };
      } finally {
        setAction(null);
      }
    },
    [sendOtpMutation],
  );

  const resendOtp = useCallback(
    async (input: { email: string; flow: AuthFlow }) => {
      setAction("resend");
      try {
        const result = await resendOtpMutation.mutateAsync(input);
        if (result?.previewCode) savePreviewOtp(result.previewCode);
        return { success: true as const };
      } catch (error) {
        return {
          success: false as const,
          message: getErrorMessage(error),
        };
      } finally {
        setAction(null);
      }
    },
    [resendOtpMutation],
  );

  const isLoading =
    sendOtpMutation.isPending || resendOtpMutation.isPending || action !== null;

  return {
    isLoading,
    sendOtp,
    resendOtp,
  };
}
