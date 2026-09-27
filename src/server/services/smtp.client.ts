import nodemailer from "nodemailer";

import { env } from "@/env";

function normalizeSmtpPassword(password: string | undefined) {
  return password?.replace(/\s+/g, "") ?? "";
}

export function isSmtpConfigured() {
  return Boolean(
    env.SMTP_HOST &&
      env.SMTP_USER &&
      env.SMTP_PASS &&
      env.EMAIL_FROM,
  );
}

export function createSmtpTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: normalizeSmtpPassword(env.SMTP_PASS),
    },
  });
}
