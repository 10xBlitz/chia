import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_SIGNUP_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }
  if (password === adminPassword) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json(
    { success: false, error: "비밀번호가 올바르지 않습니다." },
    { status: 401 }
  );
}
