"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Unknown error";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          인증 오류 발생 {/* Auth Error Occurred */}
        </h1>
        <p className="mb-2 text-gray-700">
          인증 과정에서 오류가 발생했습니다.{" "}
          {/* An error occurred during authentication. */}
        </p>
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm break-all">
          {error}
        </div>
        <Button asChild className="w-full mt-2">
          <Link href="/auth/login">
            로그인 페이지로 돌아가기 {/* Back to Login */}
          </Link>
        </Button>
      </div>
    </div>
  );
}
