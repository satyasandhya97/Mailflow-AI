import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { env } from "@/env";
import {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  type AuthFlow,
} from "@/server/auth/auth.constants";
import {
  addMinutes,
  createId,
  generateOtpCode,
  hashValue,
} from "@/server/auth/auth.crypto";
import { db } from "@/server/db";
import { otpCodes } from "@/server/db/schema";
import { sendOtpEmail } from "@/server/services/email.service";

type IssueOtpInput = {
  email: string;
  flow: AuthFlow;
  fullName?: string;
  enforceCooldown?: boolean;
};

export async function issueOtp({
  email,
  flow,
  fullName,
  enforceCooldown = false,
}: IssueOtpInput) {
  if (enforceCooldown) {
    const [latestOtp] = await db
      .select({ createdAt: otpCodes.createdAt })
      .from(otpCodes)
      .where(eq(otpCodes.email, email))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (latestOtp) {
      const elapsedSeconds =
        (Date.now() - latestOtp.createdAt.getTime()) / 1000;

      if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
        const retryIn = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
        throw new Error(`Please wait ${retryIn}s before requesting a new code`);
      }
    }
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)));

  const code = generateOtpCode();
  const now = new Date();

  await db.insert(otpCodes).values({
    id: createId(),
    email,
    codeHash: hashValue(code),
    flow,
    fullName: flow === "signup" ? fullName : null,
    expiresAt: addMinutes(now, OTP_EXPIRY_MINUTES),
  });

  await sendOtpEmail({ email, code, flow });

  return {
    success: true as const,
    // Outside production, return the code so the verify screen can auto-fill it.
    // Never expose the code in production — that would defeat OTP security.
    previewCode: env.NODE_ENV !== "production" ? code : undefined,
  };
}

export async function verifyOtpCode(email: string, otp: string) {
  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!record) {
    throw new Error("OTP expired or invalid. Request a new code.");
  }

  if (record.codeHash !== hashValue(otp)) {
    throw new Error("Incorrect OTP. Please try again.");
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, record.id));

  return record;
}
