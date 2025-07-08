import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        console.log(
          "=--->local environment detected, redirecting to origin with next path"
        );
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host

        return NextResponse.redirect(
          `${origin}${next}/auth/sign-up/finish-signup-oAuth`
        );
      } else if (forwardedHost) {
        console.log(
          "----> forwardedHost detected, redirecting to it with next path"
        );
        return NextResponse.redirect(
          `https://${forwardedHost}${next}/auth/sign-up/finish-signup-oAuth`
        );
      } else {
        console.log(
          "----> no forwardedHost, redirecting to origin with next path"
        );
        return NextResponse.redirect(
          `${origin}${next}/auth/sign-up/finish-signup-oAuth`
        );
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
