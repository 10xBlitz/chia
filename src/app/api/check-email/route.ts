import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
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
