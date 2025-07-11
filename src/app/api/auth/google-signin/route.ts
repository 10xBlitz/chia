import { createClient } from "@/lib/supabase/server"; // Adjust import path as needed
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Create Supabase client on the server
    const supabase = await createClient();

    // Sign in with Google ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      console.error("Supabase auth error:", error);
      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 400 }
      );
    }

    // Return the session data
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
