import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public access to /api/check-email
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/clinics") &&
    !request.nextUrl.pathname.startsWith("/clinic") &&
    !(request.nextUrl.pathname === "/") &&
    !(request.nextUrl.pathname === "/terms-of-service")
  ) {
    // no user, potentially respond by redirecting the user to the login page

    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const role = user?.user_metadata?.role;

  console.log("---->role:", role);

  if (user) {
    // Check clinic status for dentists
    if (role === "dentist") {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("user")
          .select("clinic_id, clinic:clinic_id(status)")
          .eq("id", user.id)
          .single();

        console.log("---->userProfile:", userProfile);
        console.log("---->user.id:", user.id);
        console.log("---->profileError:", profileError);

        // If dentist's clinic is deleted, sign them out
        if (userProfile?.clinic && userProfile.clinic.status === "deleted") {
          console.log("---->clinic status: ", userProfile.clinic.status);
          await supabase.auth.signOut();
          const url = request.nextUrl.clone();
          url.pathname = "/auth/login";
          url.searchParams.set(
            "message",
            "관리자가 귀하의 클리닉을 삭제했으며, 귀하는 로그아웃되었습니다."
          ); // "Your clinic has been deleted by the admin, and you have been logged out."
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error("Error checking clinic status:", error);
      }
    }

    if (request.nextUrl.pathname.startsWith("/patient") && role !== "patient") {
      // User is not a patient, redirect to forbidden page
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname.startsWith("/dentist") && role !== "dentist") {
      // User is not a dentist, redirect to forbidden page
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      // User is not an admin, redirect to forbidden page
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      return NextResponse.redirect(url);
    }

    // if (!role && publicRoutes.includes(request.nextUrl.pathname)) {
    //   // User is logged in but has no role, redirect to profile setup
    //   console.log("--->includes:", request.nextUrl.pathname);
    //   const url = request.nextUrl.clone();
    //   url.pathname = "/auth/sign-up/finish-signup-for-kakao";
    //   url.searchParams.set("message", "회원가입을 완료해주세요");
    //   return NextResponse.redirect(url);
    // }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
