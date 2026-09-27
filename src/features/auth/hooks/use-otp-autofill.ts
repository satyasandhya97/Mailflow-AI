"use client";

import { useEffect, useRef } from "react";

import { OTP_LENGTH } from "@/features/auth/constants/auth.constants";

function normalizeOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

type UseOtpAutofillOptions = {
  onCode: (code: string) => void;
  enabled?: boolean;
};

/**
 * Listens for OTP codes from the browser (email/SMS Web OTP API) and fills the form.
 * Requires the OTP email to include `@<host> #<code>` for email transport.
 */
export function useOtpAutofill({
  onCode,
  enabled = true,
}: UseOtpAutofillOptions) {
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!("OTPCredential" in window)) return;

    const ac = new AbortController();

    void (async () => {
      try {
        const credential = await navigator.credentials.get({
          otp: { transport: ["email", "sms"] },
          signal: ac.signal,
        } as CredentialRequestOptions);

        if (!credential || !("code" in credential)) return;

        const code = normalizeOtp(String(credential.code));
        if (code.length === OTP_LENGTH) {
          onCodeRef.current(code);
        }
      } catch {
        // Dismissed, unsupported, or no matching message — expected.
      }
    })();

    return () => ac.abort();
  }, [enabled]);
}
