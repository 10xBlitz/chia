"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const requestData = {
      orderId: searchParams.get("orderId"),
      amount: searchParams.get("amount"),
      paymentKey: searchParams.get("paymentKey"),
    };
    async function confirm() {
      const response = await fetch("/api/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const json = await response.json();

      if (!response.ok) {
        router.push(
          `/patient/reservation/payment/fail?message=${json.message}&code=${json.code}`
        );
        return;
      }
      // 결제 성공 후 추가 비즈니스 로직이 필요하다면 여기에 작성
    }
    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoHome = () => {
    router.push("/patient/reservation");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full flex flex-col items-center">
        <svg
          className="mb-4 text-green-500"
          width={56}
          height={56}
          fill="none"
          viewBox="0 0 56 56"
        >
          <circle cx="28" cy="28" r="28" fill="#22C55E" opacity="0.15" />
          <path
            d="M18 29.5L25 36.5L38 23.5"
            stroke="#22C55E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          결제가 완료되었습니다!
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          결제가 정상적으로 처리되었습니다.
          <br />
          아래에서 결제 정보를 확인하세요.
        </p>
        <div className="w-full mb-6">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">주문번호</span>
            <span className="font-medium">{searchParams.get("orderId")}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">결제 금액</span>
            <span className="font-medium">
              {Number(searchParams.get("amount")).toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Payment Key</span>
            <span className="font-mono text-xs text-gray-700 break-all">
              {searchParams.get("paymentKey")}
            </span>
          </div>
        </div>
        <button
          onClick={handleGoHome}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
