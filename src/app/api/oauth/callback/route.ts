import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { handleOAuthCallback } from "@/server/services/integrations.service";
import { isCorsairAccountHealableError } from "@/server/services/corsair-account-reset.service";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  const redirectUrl = new URL("/plugins", env.APP_URL);

  if (oauthError) {
    redirectUrl.searchParams.set("oauth_error", oauthError);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    redirectUrl.searchParams.set("oauth_error", "missing_code_or_state");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const result = await handleOAuthCallback(code, state);
    redirectUrl.searchParams.set("connected", result.plugin);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[oauth] Callback failed:", error);
    redirectUrl.searchParams.set(
      "oauth_error",
      isCorsairAccountHealableError(error)
        ? "credentials_corrupt"
        : "callback_failed",
    );
    return NextResponse.redirect(redirectUrl);
  }
}
