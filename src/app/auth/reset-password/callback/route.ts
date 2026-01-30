import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/forgot-password?error=missing_code`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error exchanging code for session:", error);
    // If PKCE fails (code verifier missing), redirect to forgot-password with error
    return NextResponse.redirect(
      `${origin}/auth/forgot-password?error=invalid_or_expired_link`
    );
  }

  // Session established, redirect to update-password page
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin;

  return NextResponse.redirect(
    `${baseUrl}/auth/update-password?redirect=${encodeURIComponent(redirect)}`
  );
}
