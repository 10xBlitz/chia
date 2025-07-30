import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    const userId = (await supabase.auth.getUser()).data.user?.id;

    //check if users login status is "active"
    const { data: userData } = await supabase
      .from("user")
      .select("login_status")
      .eq("id", userId || "")
      .maybeSingle();

    console.log("---->userData:", userData);

    if (userData && userData.login_status !== "active") {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/auth/deleted-account-page`);
    }

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host

        return NextResponse.redirect(
          `${origin}${next}/auth/sign-up/finish-signup-oAuth`
        );
      } else if (forwardedHost) {
        return NextResponse.redirect(
          `https://${forwardedHost}${next}/auth/sign-up/finish-signup-oAuth`
        );
      } else {
        return NextResponse.redirect(
          `${origin}${next}/auth/sign-up/finish-signup-oAuth`
        );
      }
    }
    console.log("---->error in exchangeCodeForSession:", error);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?message=${error}`);
}
