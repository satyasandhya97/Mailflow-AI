"use server";

import { OTP_LENGTH } from "@/features/auth/constants/auth.constants";
import type { AuthFlow } from "@/features/auth/types/auth.types";
import { setSessionCookie } from "@/server/auth/session-cookie";
import * as authService from "@/server/services/auth.service";

export type VerifyOtpActionResult =
  | { success: true }
  | { success: false; message: string };

export async function verifyOtpAndLogin(input: {
  email: string;
  flow: AuthFlow;
  otp: string;
}): Promise<VerifyOtpActionResult> {
  const email = input.email.trim().toLowerCase();
  const otp = input.otp.trim();

  if (otp.length !== OTP_LENGTH || !/^\d+$/.test(otp)) {
    return {
      success: false,
      message: `OTP must be ${OTP_LENGTH} digits`,
    };
  }

  try {
    const result = await authService.verifyOtp({
      email,
      flow: input.flow,
      otp,
    });
    await setSessionCookie(result.token);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to verify OTP",
    };
  }
}
