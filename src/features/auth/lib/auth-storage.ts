import {
  AUTH_FLOW_KEY,
  AUTH_PENDING_EMAIL_KEY,
  AUTH_PREVIEW_OTP_KEY,
  AUTH_SIGNUP_DRAFT_KEY,
} from "@/features/auth/constants/auth.constants";
import type { AuthFlow, SignupDraft } from "@/features/auth/types/auth.types";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function saveSignupDraft(draft: SignupDraft) {
  writeJson(AUTH_SIGNUP_DRAFT_KEY, draft);
}

export function getSignupDraft(): SignupDraft | null {
  return readJson<SignupDraft>(AUTH_SIGNUP_DRAFT_KEY);
}

export function savePendingEmail(email: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_PENDING_EMAIL_KEY, email);
}

export function getPendingEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_PENDING_EMAIL_KEY);
}

export function saveAuthFlow(flow: AuthFlow) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_FLOW_KEY, flow);
}

export function getAuthFlow(): AuthFlow | null {
  if (typeof window === "undefined") return null;
  const flow = sessionStorage.getItem(AUTH_FLOW_KEY);
  return flow === "signup" || flow === "login" ? flow : null;
}

export function savePreviewOtp(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_PREVIEW_OTP_KEY, code);
}

export function getPreviewOtp(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_PREVIEW_OTP_KEY);
}

export function clearPreviewOtp() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_PREVIEW_OTP_KEY);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_SIGNUP_DRAFT_KEY);
  sessionStorage.removeItem(AUTH_PENDING_EMAIL_KEY);
  sessionStorage.removeItem(AUTH_FLOW_KEY);
  sessionStorage.removeItem(AUTH_PREVIEW_OTP_KEY);
}
