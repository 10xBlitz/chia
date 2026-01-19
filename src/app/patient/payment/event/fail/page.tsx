"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoHome = () => {
    router.push("/patient/reservation");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full flex flex-col items-center">
        <svg
          className="mb-4 text-red-500"
          width={56}
          height={56}
          fill="none"
          viewBox="0 0 56 56"
        >
          <circle cx="28" cy="28" r="28" fill="#EF4444" opacity="0.15" />
          <path
            d="M36 20L20 36M20 20l16 16"
            stroke="#EF4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          결제에 실패했습니다
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          결제 처리 중 오류가 발생했습니다.
          <br />
          아래의 정보를 확인하시고 다시 시도해 주세요.
        </p>
        <div className="w-full mb-6">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">에러 코드</span>
            <span className="font-medium">{searchParams.get("code")}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">실패 사유</span>
            <span className="font-mono text-xs text-gray-700 break-all">
              {searchParams.get("message")}
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

export default function FailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">Loading...</div>}>
      <FailPageContent />
    </Suspense>
  );
}
