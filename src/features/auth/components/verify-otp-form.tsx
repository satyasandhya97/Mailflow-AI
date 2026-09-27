"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { verifyOtpAndLogin } from "@/features/auth/actions/verify-otp.action";
import { AuthCard } from "@/features/auth/components/auth-card";
import { FormOtpField } from "@/features/auth/components/form-otp-field";
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
} from "@/features/auth/constants/auth.constants";
import { useAuthApi } from "@/features/auth/hooks/use-auth-api";
import { useOtpAutofill } from "@/features/auth/hooks/use-otp-autofill";
import { useOtpResend } from "@/features/auth/hooks/use-otp-resend";
import {
  clearAuthSession,
  getPreviewOtp,
} from "@/features/auth/lib/auth-storage";
import {
  verifyOtpSchema,
  type VerifyOtpFormValues,
} from "@/features/auth/schemas/auth.schemas";
import type { AuthFlow } from "@/features/auth/types/auth.types";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  const visible = local.slice(0, 1);
  const masked =
    local.length > 1 ? "*".repeat(Math.min(local.length - 1, 3)) : "";
  return `${visible}${masked}@${domain}`;
}

type VerifyOtpFormProps = {
  email: string;
  flow: AuthFlow;
};

export function VerifyOtpForm({ email, flow }: VerifyOtpFormProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { resendOtp, isLoading: isResendLoading } = useAuthApi();

  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onSubmit",
  });

  const otpValue = form.watch("otp");
  const isOtpComplete = otpValue.length === OTP_LENGTH;

  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const autofilledRef = useRef(false);
  const submitRef = useRef<() => void>(() => undefined);

  const changeEmailHref = flow === "signup" ? "/signup" : "/login";

  const handleResend = useCallback(async () => {
    const result = await resendOtp({ email, flow });
    if (!result.success) {
      toast.error(result.message);
      throw new Error(result.message);
    }
    toast.success("A new OTP has been sent");

    const code = getPreviewOtp();
    if (code && code.length === OTP_LENGTH) {
      setPreviewOtp(code);
      form.setValue("otp", code, { shouldValidate: true });
    }
  }, [email, flow, resendOtp, form]);

  const isLoading = isVerifying || isResendLoading;

  const applyOtpCode = useCallback(
    (code: string, options?: { autoSubmit?: boolean }) => {
      const normalized = code.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (normalized.length !== OTP_LENGTH) return;
      form.setValue("otp", normalized, { shouldValidate: true });
      if (options?.autoSubmit && !isVerifying) {
        setTimeout(() => submitRef.current(), 300);
      }
    },
    [form, isVerifying],
  );

  const handleOtpComplete = useCallback(
    (code: string) => {
      applyOtpCode(code, { autoSubmit: true });
    },
    [applyOtpCode],
  );

  useOtpAutofill({
    onCode: (code) => applyOtpCode(code, { autoSubmit: true }),
    enabled: !isLoading,
  });

  const { cooldown, isResending, canResend, resend } =
    useOtpResend(handleResend);

  const description = useMemo(
    () =>
      `Enter the 8-digit code sent to ${maskEmail(email)}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    [email],
  );

  async function onSubmit(values: VerifyOtpFormValues) {
    setIsVerifying(true);

    try {
      const result = await verifyOtpAndLogin({
        email,
        flow,
        otp: values.otp,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      clearAuthSession();
      toast.success(
        flow === "signup"
          ? "Account verified — logging you in…"
          : "Logged in successfully",
      );
      window.location.assign("/dashboard");
    } finally {
      setIsVerifying(false);
    }
  }

  // Keep a fresh reference to the submit handler for the auto-submit timer.
  useEffect(() => {
    submitRef.current = form.handleSubmit(onSubmit);
  });

  // Auto-fill (and auto-submit) the code surfaced by the server in non-prod.
  useEffect(() => {
    if (autofilledRef.current) return;
    const code = getPreviewOtp();
    if (!code || code.length !== OTP_LENGTH) return;

    autofilledRef.current = true;
    setPreviewOtp(code);
    form.setValue("otp", code, { shouldValidate: true });

    const timer = setTimeout(() => submitRef.current(), 700);
    return () => clearTimeout(timer);
  }, [form]);

  return (
    <AuthCard title="Verify your email" description={description}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {previewOtp ? (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-center text-sm">
              <span className="text-muted-foreground">Your code: </span>
              <span className="font-semibold tracking-[0.3em] tabular-nums">
                {previewOtp}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Auto-filled for you
              </span>
            </div>
          ) : null}

          <FormOtpField
            control={form.control}
            name="otp"
            disabled={isLoading}
            autoFocus
            onComplete={handleOtpComplete}
          />

          <Button
            type="submit"
            className="h-10 w-full"
            disabled={isLoading || !isOtpComplete}
          >
            {isVerifying ? (
              <>
                <Spinner className="mr-2" />
                Logging you in…
              </>
            ) : (
              "Verify & continue"
            )}
          </Button>

          <div className="flex flex-col items-center gap-2 text-sm">
            <Button
              type="button"
              variant="ghost"
              disabled={!canResend || isVerifying}
              onClick={() => void resend()}
            >
              {isResending ? (
                <>
                  <Spinner className="mr-2" />
                  Resending…
                </>
              ) : canResend ? (
                "Resend code"
              ) : (
                `Resend code in ${cooldown}s`
              )}
            </Button>

            <Link
              href={changeEmailHref}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Use a different email
            </Link>
          </div>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
