import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  console.log("--->email: ", email);
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  console.log("---->data: ", data);
  if (error) {
    console.log("---->error: ", error);
    return NextResponse.json(
      { exists: false, error: error.message },
      { status: 500 }
    );
  }

  const exists = data?.users?.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  return NextResponse.json({ exists });
}
