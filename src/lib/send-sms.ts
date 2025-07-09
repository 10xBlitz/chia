// Utility function to send SMS via Solapi (calls secure API route)

export async function sendSolapiSMS({
  to,
  text,
  type = "SMS",
}: {
  to: string;
  text: string;
  type?: "SMS" | "LMS" | "MMS";
}) {
  const res = await fetch("/api/send-sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, text, type }),
  });
  const result = await res.json();
  if (!res.ok) {
    return { ok: false, error: result?.message || "SMS API 오류", result };
  }
  return { ok: true, result };
}
