import type { AuthFlow } from "@/server/auth/auth.constants";
import { desc, eq } from "drizzle-orm";
import { issueOtp, verifyOtpCode } from "@/server/services/otp.service";
import {
  createUser,
  createUserSession,
  deleteSession,
  findUserByEmail,
} from "@/server/services/session.service";
import { db } from "@/server/db";
import { otpCodes } from "@/server/db/schema";

type SendOtpInput = {
  email: string;
  flow: AuthFlow;
  fullName?: string;
  enforceCooldown?: boolean;
};

export async function sendOtp(input: SendOtpInput) {
  const existingUser = await findUserByEmail(input.email);

  if (input.flow === "signup" && existingUser) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  if (input.flow === "login" && !existingUser) {
    throw new Error("No account found for this email. Please sign up.");
  }

  if (input.flow === "signup" && !input.fullName?.trim()) {
    throw new Error("Full name is required for signup.");
  }

  return issueOtp({
    email: input.email,
    flow: input.flow,
    fullName: input.fullName?.trim(),
    enforceCooldown: input.enforceCooldown,
  });
}

export async function resendOtp(email: string, flow: AuthFlow) {
  let fullName: string | undefined;

  if (flow === "signup") {
    const [latestOtp] = await db
      .select({ fullName: otpCodes.fullName })
      .from(otpCodes)
      .where(eq(otpCodes.email, email))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    fullName = latestOtp?.fullName ?? undefined;
  }

  return sendOtp({ email, flow, fullName, enforceCooldown: true });
}

export async function verifyOtp(input: {
  email: string;
  otp: string;
  flow: AuthFlow;
}) {
  const record = await verifyOtpCode(input.email, input.otp);

  if (record.flow !== input.flow) {
    throw new Error("OTP expired or invalid. Request a new code.");
  }

  let user = await findUserByEmail(input.email);

  if (input.flow === "signup") {
    if (user) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    let displayName = record.fullName?.trim() ?? "";
    if (!displayName) displayName = "User";
    user = await createUser(input.email, displayName);
  }

  if (!user) {
    throw new Error("No account found for this email. Please sign up.");
  }

  const token = await createUserSession(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  };
}

export async function logout(token: string | null | undefined) {
  if (!token) return;
  await deleteSession(token);
}
