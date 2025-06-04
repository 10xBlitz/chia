import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paymentKey, orderId, amount } = body;

  const widgetSecretKey = "test_sk_5OWRapdA8dWY2JWKvZRYro1zEqZK";
  const encryptedSecretKey =
    "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        amount,
        paymentKey,
      }),
    }
  );

  const responseBody = await response.json();

  return new Response(JSON.stringify(responseBody), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
