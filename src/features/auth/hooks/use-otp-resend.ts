"use client";

import { useCallback, useEffect, useState } from "react";

import { OTP_RESEND_COOLDOWN_SECONDS } from "@/features/auth/constants/auth.constants";

export function useOtpResend(onResend: () => Promise<void>) {
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resend = useCallback(async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await onResend();
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isResending, onResend]);

  return {
    cooldown,
    isResending,
    canResend: cooldown === 0 && !isResending,
    resend,
  };
}
