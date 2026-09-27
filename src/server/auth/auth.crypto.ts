import { createHash, randomBytes, randomInt } from "node:crypto";

import { env } from "@/env";
import { OTP_LENGTH } from "@/server/auth/auth.constants";

export function createId() {
  return randomBytes(16).toString("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashValue(value: string) {
  return createHash("sha256")
    .update(`${value}:${env.AUTH_SECRET}`)
    .digest("hex");
}

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  const code = randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
  return code;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}
