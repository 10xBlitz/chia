import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { to, text, type } = await req.json();

    console.log({ to, text, type });
    if (!to || !text) {
      return NextResponse.json(
        { ok: false, message: "Missing parameters" },
        { status: 400 }
      );
    }
    const from = process.env.SOLAPI_FROM_NUMBER!;
    const apiKey = process.env.NEXT_PUBLIC_SOLAPI_API_KEY!;
    const apiSecret = process.env.SOLAPI_SECRET_API_KEY!;
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString("hex");
    const hmac = crypto.createHmac("sha256", apiSecret);
    hmac.update(date + salt);
    const signature = hmac.digest("hex");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    };
    const body = {
      message: {
        to,
        text,
        from,
        type: type || "SMS",
      },
    };
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const result = await res.json();
    return NextResponse.json({ ok: res.ok, result }, { status: res.status });
  } catch (error) {
    console.error("---->error sending sms message: ", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
