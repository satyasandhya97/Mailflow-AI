import { env } from "@/env";
import {
  createSmtpTransporter,
  isSmtpConfigured,
} from "@/server/services/smtp.client";

type SendOtpEmailInput = {
  email: string;
  code: string;
  flow: "signup" | "login";
};

function getOtpOriginHost() {
  try {
    return new URL(env.APP_URL).host;
  } catch {
    return "localhost:3000";
  }
}

export async function sendOtpEmail({ email, code, flow }: SendOtpEmailInput) {
  const subject =
    flow === "signup"
      ? "Verify your Mailflow AI account"
      : "Your Mailflow AI login code";

  const originHost = getOtpOriginHost();
  const webOtpLine = `@${originHost} #${code}`;

  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #1a1916;">
      <h2 style="margin-bottom: 8px;">Your verification code</h2>
      <p style="margin-top: 0;">Use this code to ${flow === "signup" ? "complete signup" : "log in"}. It expires in 5 minutes.</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em; margin: 24px 0;">${code}</p>
      <p style="color: #6b675f;">If you did not request this code, you can ignore this email.</p>
      <p style="display: none; color: #6b675f; font-size: 12px;">${webOtpLine}</p>
    </div>
  `.trim();

  const text = [
    `Your Mailflow AI verification code is ${code}.`,
    "It expires in 5 minutes.",
    "",
    webOtpLine,
  ].join("\n");

  if (!isSmtpConfigured()) {
    console.info(
      `[auth] SMTP not configured (need SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM or SMTP_FROM). OTP for ${email}: ${code}`,
    );
    return;
  }

  const transporter = createSmtpTransporter();

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject,
      html,
      text,
    });

    console.info(`[auth] OTP email sent to ${email} (${info.messageId ?? "ok"})`);
  } catch (error) {
    console.error("[auth] Failed to send OTP email:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to send OTP email: ${error.message}`
        : "Failed to send OTP email",
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type SendTaskResultEmailInput = {
  email: string;
  taskTitle: string;
  output: string;
};

/**
 * Delivers the result of a completed agent task to the user's email.
 * Best-effort: failures are logged but never break the task run.
 */
export async function sendTaskResultEmail({
  email,
  taskTitle,
  output,
}: SendTaskResultEmailInput) {
  if (!isSmtpConfigured()) {
    console.info(
      `[tasks] SMTP not configured; skipping result email for "${taskTitle}".`,
    );
    return;
  }

  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #1a1916;">
      <p style="margin: 0 0 4px; color: #6b675f;">Your Corsair agent task finished</p>
      <h2 style="margin: 0 0 16px;">${escapeHtml(taskTitle)}</h2>
      <div style="white-space: pre-wrap; background: #f6f5f2; border-radius: 12px; padding: 16px; font-size: 14px;">${escapeHtml(output)}</div>
      <p style="color: #6b675f; margin-top: 24px;">Sent automatically by Mailflow AI.</p>
    </div>
  `.trim();

  try {
    const transporter = createSmtpTransporter();
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: `✓ Task done: ${taskTitle}`,
      html,
    });
    console.info(
      `[tasks] Result email sent to ${email} (${info.messageId ?? "ok"})`,
    );
  } catch (error) {
    console.error("[tasks] Failed to send task result email:", error);
  }
}

type SendTaskFailureEmailInput = {
  email: string;
  taskTitle: string;
  error: string;
  attempts: number;
};

/**
 * Notifies the user that an agent task failed after exhausting its retries.
 * Best-effort: failures are logged but never break the task run.
 */
export async function sendTaskFailureEmail({
  email,
  taskTitle,
  error,
  attempts,
}: SendTaskFailureEmailInput) {
  if (!isSmtpConfigured()) {
    console.info(
      `[tasks] SMTP not configured; skipping failure email for "${taskTitle}".`,
    );
    return;
  }

  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #1a1916;">
      <p style="margin: 0 0 4px; color: #b91c1c;">Your Corsair agent task failed</p>
      <h2 style="margin: 0 0 16px;">${escapeHtml(taskTitle)}</h2>
      <p style="margin: 0 0 8px; color: #6b675f;">Failed after ${attempts} attempt${attempts === 1 ? "" : "s"}.</p>
      <div style="white-space: pre-wrap; background: #fef2f2; border-radius: 12px; padding: 16px; font-size: 14px; color: #991b1b;">${escapeHtml(error)}</div>
      <p style="color: #6b675f; margin-top: 24px;">Open Mailflow AI to retry or edit this task.</p>
    </div>
  `.trim();

  try {
    const transporter = createSmtpTransporter();
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: `⚠ Task failed: ${taskTitle}`,
      html,
    });
    console.info(
      `[tasks] Failure email sent to ${email} (${info.messageId ?? "ok"})`,
    );
  } catch (sendError) {
    console.error("[tasks] Failed to send task failure email:", sendError);
  }
}
